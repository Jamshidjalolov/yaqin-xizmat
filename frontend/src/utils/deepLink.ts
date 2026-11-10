export interface DeepLinkParams {
  serviceId: number | null;
  category: string | null;
  search: string | null;
  view: 'grid' | 'map' | null;
  tab: 'services' | 'categories' | 'search' | null;
}

export function parseDeepLink(): DeepLinkParams {
  if (typeof window === 'undefined') {
    return { serviceId: null, category: null, search: null, view: null, tab: null };
  }

  const searchParams = new URLSearchParams(window.location.search);
  let serviceId: number | null = null;
  let category: string | null = null;
  let search: string | null = null;
  let view: 'grid' | 'map' | null = null;
  let tab: 'services' | 'categories' | 'search' | null = null;

  // 1. Direct query parameters
  const rawService = searchParams.get('service_id') || searchParams.get('service') || searchParams.get('id');
  if (rawService) {
    const num = Number(rawService);
    if (Number.isSafeInteger(num) && num > 0) serviceId = num;
  }

  const rawCat = searchParams.get('category') || searchParams.get('cat');
  if (rawCat && rawCat.trim()) {
    category = rawCat.trim();
  }

  const rawSearch = searchParams.get('search') || searchParams.get('q');
  if (rawSearch && rawSearch.trim()) {
    search = rawSearch.trim();
  }

  const rawView = searchParams.get('view');
  if (rawView === 'map' || rawView === 'grid') {
    view = rawView;
  }

  const rawTab = searchParams.get('tab');
  if (rawTab === 'services' || rawTab === 'categories' || rawTab === 'search') {
    tab = rawTab;
  }

  // 2. Hash fragments, e.g. #service-5
  const hash = window.location.hash || '';
  const hashService = hash.match(/#service-(\d+)/);
  if (!serviceId && hashService) {
    const num = Number(hashService[1]);
    if (Number.isSafeInteger(num) && num > 0) serviceId = num;
  }

  // 3. Telegram WebApp start_param (masalan tgWebAppStartParam yoki initDataUnsafe.start_param)
  const tgWebApp = window.Telegram?.WebApp;
  const startParam =
    (tgWebApp?.initDataUnsafe as { start_param?: string } | undefined)?.start_param ||
    searchParams.get('tgWebAppStartParam') ||
    '';

  if (startParam) {
    if (startParam.startsWith('service_') || startParam.startsWith('s_')) {
      const num = Number(startParam.replace(/^(service_|s_)/, ''));
      if (Number.isSafeInteger(num) && num > 0) serviceId = num;
    } else if (startParam.startsWith('map_')) {
      const num = Number(startParam.replace(/^map_/, ''));
      if (Number.isSafeInteger(num) && num > 0) {
        serviceId = num;
        view = 'map';
      }
    } else if (startParam.startsWith('cat_') || startParam.startsWith('c_')) {
      category = decodeURIComponent(startParam.replace(/^(cat_|c_)/, ''));
    } else if (startParam.startsWith('search_') || startParam.startsWith('q_')) {
      search = decodeURIComponent(startParam.replace(/^(search_|q_)/, ''));
    }
  }

  return { serviceId, category, search, view, tab };
}
