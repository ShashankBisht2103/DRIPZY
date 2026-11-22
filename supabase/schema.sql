-- DRIPZY schema. Run in Supabase SQL editor. Everything the storefront shows comes from these tables.
create extension if not exists pgcrypto;

-- ROLES --------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz default now()
);
create function is_admin() returns boolean language sql security definer stable as
$$ select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles(id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.phone);  -- role is ALWAYS customer here
  return new;
end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();

-- block self-promotion: only service role / SQL editor can change role
create function protect_role() returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(),'service_role') <> 'service_role' then
    raise exception 'role can only be changed from the backend';
  end if;
  return new;
end $$;
create trigger lock_role before update on profiles for each row execute function protect_role();

-- CATALOG (dynamic categories, no hardcoding) ------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories on delete cascade,
  name text not null, slug text unique not null,
  image_url text, sort_order int default 0, is_active bool default true,
  show_in_sidebar bool default true
);
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null, description text, material text,
  price numeric(10,2) not null check (price >= 0),
  discount_price numeric(10,2) check (discount_price is null or discount_price <= price),
  category_id uuid references categories on delete set null,
  subcategory_id uuid references categories on delete set null,
  is_featured bool default false, is_new_arrival bool default false,
  is_best_seller bool default false, is_trending bool default false,
  is_sold_out bool default false, is_active bool default true,
  created_at timestamptz default now()
);
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products on delete cascade,
  url text not null, sort_order int default 0
);
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products on delete cascade,
  size text not null check (size in ('XS','S','M','L','XL','XXL')),
  color text not null, color_hex text,
  stock int not null default 0 check (stock >= 0),
  unique (product_id, size, color)
);

-- SHOPPING -----------------------------------------------------------
create table wishlist (user_id uuid references auth.users on delete cascade,
  product_id uuid references products on delete cascade, primary key (user_id, product_id));
create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  variant_id uuid references product_variants on delete cascade,
  qty int not null check (qty > 0), unique (user_id, variant_id)
);
create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text, phone text, line1 text, line2 text, city text, state text, pincode text
);
create table coupons (
  code text primary key, percent_off int, flat_off numeric(10,2),
  min_order numeric(10,2) default 0, expires_at timestamptz, is_active bool default true
);
create table settings (key text primary key, value jsonb not null);
insert into settings values
 ('shipping', '{"home_state":"Delhi","home_charge":0,"other_charge":100,"free_above":null}'),
 ('store', '{"instagram":"weardripzy"}');

-- ORDERS (written ONLY by the verified webhook / service role) -------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null default 'DRP-' || upper(substr(md5(random()::text),1,8)),
  user_id uuid references auth.users,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','confirmed','packed','shipped','delivered','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','failed','refunded')),
  subtotal numeric(10,2), shipping numeric(10,2), discount numeric(10,2), total numeric(10,2),
  coupon_code text, address jsonb not null, email text,
  razorpay_order_id text unique, razorpay_payment_id text unique,
  created_at timestamptz default now()
);
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders on delete cascade,
  variant_id uuid references product_variants, product_name text, size text, color text,
  unit_price numeric(10,2), qty int
);
create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders on delete cascade,
  status text, note text, created_at timestamptz default now()
);

-- Idempotent, atomic finalisation: call ONLY from the verified webhook.
create function finalize_paid_order(p_rzp_order text, p_payment text) returns void
language plpgsql security definer as $$
declare o orders; i order_items;
begin
  select * into o from orders where razorpay_order_id = p_rzp_order for update;
  if not found or o.payment_status = 'paid' then return; end if;
  for i in select * from order_items where order_id = o.id loop
    update product_variants set stock = stock - i.qty where id = i.variant_id and stock >= i.qty;
    if not found then
      update orders set payment_status='paid', razorpay_payment_id=p_payment, status='confirmed' where id=o.id;
      insert into order_events(order_id,status,note) values (o.id,'confirmed','Paid but stock short: needs manual review/refund');
      return;
    end if;
  end loop;
  update orders set payment_status='paid', status='confirmed', razorpay_payment_id=p_payment where id=o.id;
  insert into order_events(order_id,status,note) values (o.id,'confirmed','Payment verified');
  delete from cart_items where user_id = o.user_id;
end $$;
revoke all on function finalize_paid_order from public, anon, authenticated;

-- WEBSITE APPEARANCE (draft / publish / restore / schedule) ----------
create table media (
  id uuid primary key default gen_random_uuid(),
  path text not null, url text not null, kind text default 'image',
  width int, height int, alt text, created_at timestamptz default now()
);
create table site_sections (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('hero','full_banner','two_image','three_image',
        'collection_banner','seasonal_campaign','model_gallery','product_row','category_grid')),
  position int not null default 0,
  draft jsonb not null default '{}',      -- admin edits land here
  published jsonb,                         -- what the live site reads
  is_visible bool default true,
  publish_at timestamptz, unpublish_at timestamptz   -- scheduling
);
-- config shape (hero): {desktop_image, mobile_image, background_image, model_image,
--   headline, subheading, button_text, button_link, text_position, height}
create table site_versions (
  id uuid primary key default gen_random_uuid(),
  snapshot jsonb not null, label text, created_by uuid, created_at timestamptz default now()
);

-- Live site reads this view: published, visible, inside schedule window
create view live_sections as
  select id, type, position, published as config from site_sections
  where is_visible and published is not null
    and (publish_at is null or publish_at <= now())
    and (unpublish_at is null or unpublish_at > now())
  order by position;

create function publish_site() returns void language plpgsql security definer as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  insert into site_versions(snapshot, label, created_by)
    select coalesce(jsonb_agg(to_jsonb(s)),'[]'), 'Before publish', auth.uid() from site_sections s;
  update site_sections set published = draft;
end $$;
create function restore_site_version(v uuid) returns void language plpgsql security definer as $$
declare snap jsonb;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  select snapshot into snap from site_versions where id = v;
  delete from site_sections where true;
  insert into site_sections select * from jsonb_populate_recordset(null::site_sections, snap);
end $$;

-- ROW LEVEL SECURITY -------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['profiles','categories','products','product_images','product_variants','wishlist',
    'cart_items','addresses','coupons','settings','orders','order_items','order_events','media','site_sections','site_versions']
  loop execute format('alter table %I enable row level security', t); end loop; end $$;

-- public read (browse without login)
create policy pub_cat   on categories       for select using (is_active or is_admin());
create policy pub_prod  on products         for select using (is_active or is_admin());
create policy pub_img   on product_images   for select using (true);
create policy pub_var   on product_variants for select using (true);
create policy pub_media on media            for select using (true);
create policy pub_set   on settings         for select using (key in ('shipping','store') or is_admin());
-- admin full control
create policy adm_cat   on categories       for all using (is_admin()) with check (is_admin());
create policy adm_prod  on products         for all using (is_admin()) with check (is_admin());
create policy adm_img   on product_images   for all using (is_admin()) with check (is_admin());
create policy adm_var   on product_variants for all using (is_admin()) with check (is_admin());
create policy adm_media on media            for all using (is_admin()) with check (is_admin());
create policy adm_set   on settings         for all using (is_admin()) with check (is_admin());
create policy adm_coup  on coupons          for all using (is_admin()) with check (is_admin());
create policy adm_sec   on site_sections    for all using (is_admin()) with check (is_admin());
create policy adm_ver   on site_versions    for all using (is_admin()) with check (is_admin());
-- live site reads published sections through the view (owner-privileged; table itself stays admin-only)
grant select on live_sections to anon, authenticated;
-- customers: own rows only
create policy own_prof  on profiles   for select using (id = auth.uid() or is_admin());
create policy upd_prof  on profiles   for update using (id = auth.uid());
create policy own_wish  on wishlist   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_cart  on cart_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_addr  on addresses  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_ord   on orders     for select using (user_id = auth.uid() or is_admin());
create policy adm_ord   on orders     for update using (is_admin());
create policy own_items on order_items  for select using (is_admin() or exists
  (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy own_evt   on order_events for select using (is_admin() or exists
  (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy adm_evt   on order_events for insert with check (is_admin());
-- no insert policy on orders/order_items: created server-side only.

-- STORAGE ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
 ('site-media','site-media',true, 10485760, array['image/jpeg','image/png','image/webp']),
 ('product-images','product-images',true, 10485760, array['image/jpeg','image/png','image/webp']);
create policy read_media  on storage.objects for select using (bucket_id in ('site-media','product-images'));
create policy admin_write on storage.objects for all
  using (bucket_id in ('site-media','product-images') and is_admin())
  with check (bucket_id in ('site-media','product-images') and is_admin());

-- FIRST ADMIN: sign up normally, then run this once in the SQL editor (never via the app):
-- update profiles set role='admin' where id = (select id from auth.users where email='YOUR_EMAIL');
