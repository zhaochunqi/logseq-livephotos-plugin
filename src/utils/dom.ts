import { PARENT_DOC } from "../constants";

export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  styles?: Record<string, string>
): HTMLElementTagNameMap[K] => {
  const element = PARENT_DOC.createElement(tag);
  if (styles) {
    Object.assign(element.style, styles);
  }
  return element;
};

export const applyStyles = (element: HTMLElement, styleObj: Record<string, string>) => {
  Object.assign(element.style, styleObj);
};
