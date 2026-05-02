interface DrawerToggleProps {
  open: boolean;
  onClick: () => void;
}

export function DrawerToggle({ open, onClick }: DrawerToggleProps) {
  return (
    <button
      type="button"
      className="drawer-toggle"
      data-testid="drawer-toggle"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      onClick={onClick}
    >
      ☰
    </button>
  );
}
