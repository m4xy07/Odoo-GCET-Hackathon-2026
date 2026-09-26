import clsx, { type ClassValue } from 'clsx';
export { type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Align UI custom token names, so tailwind-merge knows text-label-sm and text-strong-950 do not clash
const texts = ['title-h1', 'title-h2', 'title-h3', 'title-h4', 'title-h5', 'title-h6', 'label-xl', 'label-lg', 'label-md', 'label-sm', 'label-xs', 'label-2xs', 'paragraph-xl', 'paragraph-lg', 'paragraph-md', 'paragraph-sm', 'paragraph-xs', 'subheading-md', 'subheading-sm', 'subheading-xs', 'subheading-2xs', 'doc-label', 'doc-paragraph'];
const shadows = ['regular-xs', 'regular-sm', 'regular-md', 'button-primary-focus', 'button-important-focus', 'button-error-focus', 'fancy-buttons-neutral', 'fancy-buttons-primary', 'fancy-buttons-error', 'fancy-buttons-stroke', 'toggle-switch', 'switch-thumb', 'tooltip', 'custom-xs', 'custom-sm', 'custom-md', 'custom-lg'];
const borderRadii = ['10', '16', '20'];

export const twMergeConfig = {
  extend: {
    classGroups: {
      'font-size': [{ text: texts }],
      shadow: [{ shadow: shadows }],
      rounded: [{ rounded: borderRadii }],
    },
  },
};

const customTwMerge = extendTailwindMerge(twMergeConfig);

export function cn(...classes: ClassValue[]) {
  return customTwMerge(clsx(...classes));
}
