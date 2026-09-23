/** Data hooks return empty results: widgets must render an empty state, not throw. */
export const useSiteSettings = () => ({ data: undefined });
export const useSocialLinks = () => ({ data: [] });
export const useProducts = () => ({ data: [] });
export const useProjects = () => ({ data: [] });
export const useServices = () => ({ data: [] });
export const useHeroSlides = () => ({ data: [] });
export const usePublishedPage = () => ({ data: null });
export const defaultContacts = {
  phone: "0700000000",
  whatsapp: "254700000000",
  email: "studio@example.com",
};
