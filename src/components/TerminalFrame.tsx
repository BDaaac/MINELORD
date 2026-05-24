import { PropsWithChildren } from "react";

export function TerminalFrame({
  title,
  danger = false,
  action,
  children,
}: PropsWithChildren<{ title?: string; danger?: boolean; action?: React.ReactNode }>) {
  return (
    <section className={`terminal-frame ${danger ? "terminal-frame--danger" : ""}`}>
      {action ? <div className="terminal-frame-action">{action}</div> : null}
      {title ? <div className="terminal-title">╔══ {title} ══╗</div> : null}
      {children}
    </section>
  );
}
