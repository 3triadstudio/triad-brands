// Small, explicit, tree-shakeable icon set for the PUBLIC site (footer social
// links). The admin's icon picker (src/components/admin/IconPicker.tsx) offers
// the complete ~1,900-icon library via lucide's per-icon dynamic loader
// (`DynamicIcon`) — fine there, since that cost is isolated to the admin-only
// route chunk. But `DynamicIcon` needs its full name→import dispatch table
// (every possible icon's lazy-loader function) wherever it's used, and that
// table alone is a real ~230 kB even after minification — worth paying once
// in the admin studio, not on every public page load for what's typically
// three to six footer icons. So the public renderer stays on plain, named
// imports covering the common set, falling back to Globe for anything a
// studio user picked from outside it.
import {
  Dribbble,
  Facebook,
  Github,
  Globe,
  Instagram,
  Link as LinkIcon,
  Linkedin,
  Mail,
  Phone,
  Rss,
  Send,
  Twitch,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

export const commonSocialIcons: Record<string, LucideIcon> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  github: Github,
  twitch: Twitch,
  dribbble: Dribbble,
  globe: Globe,
  mail: Mail,
  phone: Phone,
  link: LinkIcon,
  send: Send,
  rss: Rss,
};

/** Same names, for the admin picker's default view before a search. */
export const commonSocialIconNames = Object.keys(commonSocialIcons);
