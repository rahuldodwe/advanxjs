import { mount } from "./runtime";

type Route = { view: string; style: string; logic: any };

export function initRouter(routes: Record<string, Route>) {
  const host = document.getElementById("router-view");
  if (!host) return;

  const styleTag = document.createElement("style");
  styleTag.innerHTML = Object.values(routes).map(r => r.style).join("\n");
  document.head.appendChild(styleTag);

  const render = (path: string) => {
    const r = routes[path] || routes["/"];
    if (!r) return;
    host.innerHTML = r.view;
    mount(host, r.logic);
  };

  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest?.("a[ax-link]") as HTMLAnchorElement | null;
    if (!a) return;
    e.preventDefault();
    const path = a.getAttribute("ax-link")!;
    if (location.pathname !== path) history.pushState({}, "", path);
    render(path);
  });

  window.addEventListener("popstate", () => render(location.pathname));
  render(location.pathname);
}
