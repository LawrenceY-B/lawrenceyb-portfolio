import { InspectToggle } from "@/features/inspect/Inspect";
import { Ticker } from "@/features/market/Ticker";

import { ThemeToggle } from "./ThemeToggle";
import { TiltToggle } from "./TiltToggle";

export function TopBar() {
  return (
    <header className="top">
      <nav className="nav" data-inspect="Nav" aria-label="Main">
        <a className="brand" href="#hero" aria-label="LYB. home">
          LYB<span className="brand-dot">.</span>
        </a>
        <div className="glass" id="glass" data-inspect="GlassNav">
          <span className="blob" id="blob" />
          <a href="#work" className="hide-sm">
            Work
          </a>
          <a href="#about" className="hide-sm">
            About
          </a>
          <a href="#contact">Contact</a>
          <ThemeToggle />
          <TiltToggle />
          <InspectToggle />
        </div>
      </nav>
      <Ticker />
    </header>
  );
}
