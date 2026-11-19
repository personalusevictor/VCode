import React from "react";
import { RotateCcw, ArrowUpRight } from "lucide-react";
import { Mark } from "./Brand.jsx";
export default class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previous) {
    if (previous.route !== this.props.route && this.state.failed)
      this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="section page recovery-view">
        <Mark />
        <h1>
          Esta vista necesita
          <br />
          un nuevo intento.
        </h1>
        <p>Recarga la página para volver a intentarlo.</p>
        <div>
          <button className="button" onClick={() => location.reload()}>
            <RotateCcw size={17} />
            Volver a cargar
          </button>
          <a className="button secondary" href="#home">
            Volver al inicio
            <ArrowUpRight size={17} />
          </a>
        </div>
      </section>
    );
  }
}
