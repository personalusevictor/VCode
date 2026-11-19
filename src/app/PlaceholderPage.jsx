import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Mark } from "./Brand";

export default function PlaceholderPage() {
  return (
    <section className="placeholder-page">
      <Mark />
      <h1>Página provisional</h1>
      <p>Estamos preparando esta sección.</p>
      <a className="button" href="#home">
        Volver al inicio <ArrowUpRight size={17} />
      </a>
    </section>
  );
}
