-- 0011 — menswear-first category taxonomy (§10 decision 4).
--
-- Womenswear is additive data, not a code change: layer_slot already has `full`
-- for dresses/jumpsuits and `bottom` covers skirts. Adding it later is an
-- INSERT, not a migration of existing rows.
--
-- Every category maps to exactly one layer_slot (spec §4.1). `size_group` is the
-- coarse bucket used to look up user_sizes; null means the item has no size that
-- matters for stock alerts.

insert into public.categories (slug, display_name, layer_slot, size_group, sort_order) values
  -- base
  ('base-layer',      'Base layer',      'base',   'tops',   10),
  ('thermal',         'Thermals',        'base',   'tops',   11),
  ('undershirt',      'Undershirts',     'base',   'tops',   12),

  -- top
  ('t-shirt',         'T-shirts',        'top',    'tops',   20),
  ('long-sleeve-tee', 'Long-sleeve tees','top',    'tops',   21),
  ('polo',            'Polos',           'top',    'tops',   22),
  ('casual-shirt',    'Casual shirts',   'top',    'shirts', 23),
  ('oxford-shirt',    'Oxford shirts',   'top',    'shirts', 24),
  ('dress-shirt',     'Dress shirts',    'top',    'shirts', 25),
  ('flannel-shirt',   'Flannel shirts',  'top',    'shirts', 26),
  ('henley',          'Henleys',         'top',    'tops',   27),

  -- mid
  ('crew-knit',       'Crew-neck knits', 'mid',    'tops',   30),
  ('roll-neck',       'Roll necks',      'mid',    'tops',   31),
  ('cardigan',        'Cardigans',       'mid',    'tops',   32),
  ('sweatshirt',      'Sweatshirts',     'mid',    'tops',   33),
  ('hoodie',          'Hoodies',         'mid',    'tops',   34),
  ('overshirt',       'Overshirts',      'mid',    'shirts', 35),
  ('waistcoat',       'Waistcoats',      'mid',    'tops',   36),
  ('fleece',          'Fleeces',         'mid',    'tops',   37),

  -- outer
  ('rain-shell',      'Rain shells',     'outer',  'tops',   40),
  ('puffer',          'Puffer jackets',  'outer',  'tops',   41),
  ('field-jacket',    'Field jackets',   'outer',  'tops',   42),
  ('bomber',          'Bombers',         'outer',  'tops',   43),
  ('denim-jacket',    'Denim jackets',   'outer',  'tops',   44),
  ('overcoat',        'Overcoats',       'outer',  'tops',   45),
  ('trench',          'Trench coats',    'outer',  'tops',   46),
  ('blazer',          'Blazers',         'outer',  'tops',   47),
  ('gilet',           'Gilets',          'outer',  'tops',   48),

  -- bottom
  ('jeans',           'Jeans',           'bottom', 'waist',  50),
  ('chinos',          'Chinos',          'bottom', 'waist',  51),
  ('trousers',        'Trousers',        'bottom', 'waist',  52),
  ('suit-trousers',   'Suit trousers',   'bottom', 'waist',  53),
  ('joggers',         'Joggers',         'bottom', 'waist',  54),
  ('shorts',          'Shorts',          'bottom', 'waist',  55),
  ('technical-trouser','Technical trousers','bottom','waist', 56),

  -- full (occupies top + bottom)
  ('suit',            'Suits',           'full',   'tops',   60),
  ('jumpsuit',        'Boilersuits',     'full',   'tops',   61),

  -- shoes
  ('trainers',        'Trainers',        'shoes',  'shoes',  70),
  ('runners',         'Running shoes',   'shoes',  'shoes',  71),
  ('derby',           'Derbies',         'shoes',  'shoes',  72),
  ('oxford-shoe',     'Oxfords',         'shoes',  'shoes',  73),
  ('loafer',          'Loafers',         'shoes',  'shoes',  74),
  ('chelsea-boot',    'Chelsea boots',   'shoes',  'shoes',  75),
  ('work-boot',       'Boots',           'shoes',  'shoes',  76),
  ('sandal',          'Sandals',         'shoes',  'shoes',  77),

  -- accessory (repeatable slot)
  ('belt',            'Belts',           'accessory', 'waist', 80),
  ('scarf',           'Scarves',         'accessory', null,    81),
  ('beanie',          'Beanies',         'accessory', null,    82),
  ('cap',             'Caps',            'accessory', null,    83),
  ('gloves',          'Gloves',          'accessory', null,    84),
  ('backpack',        'Backpacks',       'accessory', null,    85),
  ('holdall',         'Bags',            'accessory', null,    86),
  ('watch',           'Watches',         'accessory', null,    87),
  ('sunglasses',      'Sunglasses',      'accessory', null,    88),
  ('socks',           'Socks',           'accessory', 'shoes', 89),
  ('tie',             'Ties',            'accessory', null,    90);
