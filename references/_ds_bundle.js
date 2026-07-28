/* @ds-bundle: {"format":4,"namespace":"OctopusDesignSystem_492d91","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"SectionLabel","sourcePath":"components/core/SectionLabel.jsx"},{"name":"ScheduleTable","sourcePath":"components/data/ScheduleTable.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"SocialIcons","sourcePath":"components/social/SocialIcons.jsx"}],"sourceHashes":{"components/core/Button.jsx":"44a9c5121236","components/core/IconButton.jsx":"d62c656bc87e","components/core/Panel.jsx":"d0eaa2cafca3","components/core/SectionLabel.jsx":"d9c858b4e7ad","components/data/ScheduleTable.jsx":"645ac992ca27","components/navigation/Tabs.jsx":"e7a3da5fcf5e","components/social/SocialIcons.jsx":"ad8242f36a96","ui_kits/speaker-preview-manager/Chrome.jsx":"576dce407d19","ui_kits/speaker-preview-manager/ScheduleScreen.jsx":"e0d695fc43cd","ui_kits/speaker-preview-manager/SessionScreen.jsx":"ec90766e9018","ui_kits/speaker-preview-manager/SpeakerScreen.jsx":"d632843477e9","ui_kits/speaker-preview-manager/SplashScreen.jsx":"5dae505191c0"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.OctopusDesignSystem_492d91 = window.OctopusDesignSystem_492d91 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
const sizes = {
  sm: {
    h: 32,
    fs: 'var(--fs-body-sm)',
    px: 14
  },
  md: {
    h: 40,
    fs: 'var(--fs-body)',
    px: 18
  },
  lg: {
    h: 56,
    fs: 'var(--fs-h3)',
    px: 26
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  disabled = false,
  children,
  onClick,
  style
}) {
  const s = sizes[size] || sizes.md;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: s.h,
    padding: shape === 'circle' ? 0 : `0 ${s.px}px`,
    width: shape === 'circle' ? s.h : undefined,
    borderRadius: shape === 'circle' ? '50%' : 'var(--radius-pill)',
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--fw-bold)',
    fontSize: s.fs,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'filter var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
    opacity: disabled ? 0.5 : 1
  };
  const variants = {
    primary: {
      background: 'var(--color-accent)',
      color: 'var(--color-text-on-brand)',
      boxShadow: 'var(--shadow-btn)'
    },
    navy: {
      background: 'var(--color-brand-primary)',
      color: 'var(--color-text-on-brand)',
      boxShadow: 'var(--shadow-sm)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-accent)',
      border: '1.5px solid var(--color-accent)'
    },
    ghost: {
      background: 'var(--color-bg-sunken)',
      color: 'var(--color-brand-primary)'
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    style: {
      ...base,
      ...variants[variant],
      ...style
    },
    onMouseEnter: e => !disabled && (e.currentTarget.style.filter = 'brightness(1.08)'),
    onMouseLeave: e => e.currentTarget.style.filter = 'none',
    onMouseDown: e => !disabled && (e.currentTarget.style.transform = 'scale(0.96)'),
    onMouseUp: e => e.currentTarget.style.transform = 'scale(1)'
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function IconButton({
  icon = 'back',
  size = 44,
  variant = 'primary',
  onClick,
  style
}) {
  const bg = variant === 'primary' ? 'var(--color-accent)' : variant === 'navy' ? 'var(--color-brand-primary)' : 'var(--color-bg-sunken)';
  const fg = variant === 'muted' ? 'var(--color-brand-primary)' : '#fff';
  const paths = {
    back: 'M15 6l-6 6 6 6',
    forward: 'M9 6l6 6-6 6',
    refresh: 'M4 12a8 8 0 1 1 2.34 5.66M4 12V6m0 6h6',
    play: 'M8 5l12 7-12 7z',
    close: 'M6 6l12 12M18 6L6 18'
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    "aria-label": icon,
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      background: bg,
      color: fg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'var(--shadow-sm)',
      transition: 'filter var(--dur-fast) var(--ease-standard)',
      ...style
    },
    onMouseEnter: e => e.currentTarget.style.filter = 'brightness(1.08)',
    onMouseLeave: e => e.currentTarget.style.filter = 'none'
  }, /*#__PURE__*/React.createElement("svg", {
    width: size * 0.4,
    height: size * 0.4,
    viewBox: "0 0 24 24",
    fill: icon === 'play' ? fg : 'none',
    stroke: fg,
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: paths[icon] || paths.back
  })));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
function Panel({
  children,
  padded = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border-strong)',
      borderRadius: 'var(--radius-sm)',
      padding: padded ? 'var(--sp-6)' : 0,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionLabel.jsx
try { (() => {
function SectionLabel({
  children,
  size = 'md'
}) {
  const fs = size === 'lg' ? 'var(--fs-h2)' : size === 'sm' ? 'var(--fs-body)' : 'var(--fs-h3)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      gap: 10,
      minHeight: size === 'lg' ? 28 : 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      background: 'var(--color-accent-soft)',
      borderRadius: 2,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: fs,
      color: 'var(--color-text-heading)',
      display: 'flex',
      alignItems: 'center'
    }
  }, children));
}
Object.assign(__ds_scope, { SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionLabel.jsx", error: String((e && e.message) || e) }); }

// components/data/ScheduleTable.jsx
try { (() => {
function ScheduleTable({
  rows = [],
  onEnter
}) {
  return /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['Enter', 'End', 'Session', 'Enter'].map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    style: {
      background: 'var(--color-brand-primary)',
      color: 'var(--color-text-on-brand)',
      fontSize: 'var(--fs-body)',
      fontWeight: 'var(--fw-bold)',
      textAlign: i === 2 ? 'center' : 'center',
      padding: '10px 14px',
      border: '1px solid var(--color-brand-primary)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    style: {
      background: 'var(--color-bg-surface)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      color: 'var(--color-text-muted)',
      fontSize: 'var(--fs-body-sm)',
      border: '1px solid var(--color-border)'
    }
  }, r.enter), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      color: 'var(--color-text-muted)',
      fontSize: 'var(--fs-body-sm)',
      border: '1px solid var(--color-border)'
    }
  }, r.end), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      color: 'var(--color-link)',
      fontSize: 'var(--fs-body-sm)',
      border: '1px solid var(--color-border)',
      cursor: 'pointer'
    }
  }, r.session), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      textAlign: 'center',
      border: '1px solid var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onEnter && onEnter(r),
    "aria-label": "enter",
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      border: '1.5px solid var(--color-accent)',
      background: 'transparent',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "8",
    viewBox: "0 0 24 24",
    fill: "var(--color-accent)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 5l12 7-12 7z"
  }))))))));
}
Object.assign(__ds_scope, { ScheduleTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ScheduleTable.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  active,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2
    }
  }, items.map((item, i) => {
    const isActive = item === active;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => onChange && onChange(item),
      style: {
        padding: '10px 22px',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--fs-body)',
        fontWeight: isActive ? 'var(--fw-bold)' : 'var(--fw-regular)',
        background: isActive ? 'var(--color-bg-surface)' : 'var(--color-bg-sunken)',
        color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
        borderBottom: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
        borderTop: '1px solid var(--color-border)',
        borderLeft: '1px solid var(--color-border)',
        borderRight: '1px solid var(--color-border)',
        transition: 'background var(--dur-fast) var(--ease-standard)'
      }
    }, item);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/social/SocialIcons.jsx
try { (() => {
const ICONS = {
  facebook: 'assets/icons/social/facebook.png',
  instagram: 'assets/icons/social/instagram.png',
  linkedin: 'assets/icons/social/linkedin.png',
  twitter: 'assets/icons/social/twitter.png'
};
function SocialIcons({
  networks = ['facebook', 'instagram', 'linkedin', 'twitter'],
  size = 26,
  basePath = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, networks.map(n => /*#__PURE__*/React.createElement("img", {
    key: n,
    src: basePath + ICONS[n],
    alt: n,
    width: size,
    height: size,
    style: {
      borderRadius: 6
    }
  })));
}
Object.assign(__ds_scope, { SocialIcons });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/SocialIcons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/speaker-preview-manager/Chrome.jsx
try { (() => {
function Header({
  room = 'A'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 32px',
      background: '#fff',
      borderBottom: '1px solid var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: '50%',
      background: 'var(--color-accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid var(--color-accent-soft)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.png",
    style: {
      width: 30,
      filter: 'brightness(0) invert(1)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-black)',
      fontSize: 'var(--fs-h2)',
      color: 'var(--color-brand-primary)',
      letterSpacing: 0.3
    }
  }, "INTERNATIONAL CONGRESS OF VARIATIC SURGERY")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-body-lg)',
      color: 'var(--color-text-muted)'
    }
  }, "ROOM ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent-soft)',
      fontWeight: 'var(--fw-bold)'
    }
  }, room)));
}
function Footer() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      background: 'var(--color-brand-primary)'
    }
  });
}
window.SpeakerPreviewChrome = Object.assign(window.SpeakerPreviewChrome || {}, {
  Header,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/speaker-preview-manager/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/speaker-preview-manager/ScheduleScreen.jsx
try { (() => {
function ScheduleScreen({
  days,
  active,
  onDayChange,
  onEnterSession,
  onBack
}) {
  const {
    Header,
    Footer
  } = window.SpeakerPreviewChrome;
  const {
    SectionLabel,
    Tabs,
    ScheduleTable,
    IconButton
  } = window.OctopusDesignSystem_492d91;
  const day = days.find(d => d.date === active) || days[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-page)'
    }
  }, /*#__PURE__*/React.createElement(Header, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '24px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    size: "lg"
  }, "WELCOME"), /*#__PURE__*/React.createElement(Tabs, {
    items: days.map(d => d.date),
    active: active,
    onChange: onDayChange
  }), /*#__PURE__*/React.createElement(ScheduleTable, {
    rows: day.sessions,
    onEnter: row => onEnterSession(day, row)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "back",
    onClick: onBack
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "refresh",
    variant: "navy"
  }))), /*#__PURE__*/React.createElement(Footer, null));
}
window.SpeakerPreviewChrome = Object.assign(window.SpeakerPreviewChrome || {}, {
  ScheduleScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/speaker-preview-manager/ScheduleScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/speaker-preview-manager/SessionScreen.jsx
try { (() => {
function SessionScreen({
  session,
  onGo,
  onBack
}) {
  const {
    Header,
    Footer
  } = window.SpeakerPreviewChrome;
  const {
    SectionLabel,
    IconButton,
    Button
  } = window.OctopusDesignSystem_492d91;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-page)'
    }
  }, /*#__PURE__*/React.createElement(Header, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '24px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    size: "lg"
  }, session.enter, " - ", session.end), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid var(--color-border-strong)',
      padding: 24,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-h3)',
      color: 'var(--color-brand-primary)'
    }
  }, session.speaker, ", ", session.country), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-body-lg)',
      color: 'var(--color-accent-warm)',
      marginTop: 6
    }
  }, session.title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "back",
    onClick: onBack
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onGo
  }, "Go"))), /*#__PURE__*/React.createElement(Footer, null));
}
window.SpeakerPreviewChrome = Object.assign(window.SpeakerPreviewChrome || {}, {
  SessionScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/speaker-preview-manager/SessionScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/speaker-preview-manager/SpeakerScreen.jsx
try { (() => {
function SpeakerScreen({
  session,
  showSponsor,
  onBack
}) {
  const {
    Header,
    Footer
  } = window.SpeakerPreviewChrome;
  const {
    SectionLabel,
    IconButton,
    SocialIcons
  } = window.OctopusDesignSystem_492d91;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-page)'
    }
  }, /*#__PURE__*/React.createElement(Header, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '28px 32px',
      display: 'flex',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 96,
      height: 96,
      borderRadius: '50%',
      background: 'var(--color-bg-sunken)',
      border: '3px solid var(--color-border-strong)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-brand-primary)',
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-black)',
      fontSize: 30
    }
  }, session.speaker.split(' ').map(w => w[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, session.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-h3)',
      color: 'var(--color-brand-primary)',
      margin: '8px 0 6px'
    }
  }, session.speaker, ", ", session.country), /*#__PURE__*/React.createElement(SocialIcons, {
    basePath: "../../"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-body)',
      color: 'var(--color-link)',
      lineHeight: 'var(--lh-normal)',
      marginTop: 16,
      maxWidth: 640
    }
  }, session.bio)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 150,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20
    }
  }, showSponsor && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 140,
      height: 90,
      border: '2px solid var(--color-accent)',
      clipPath: 'polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--color-accent)'
    }
  }, "Sponsor"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-body)',
      color: 'var(--color-brand-primary)',
      marginBottom: 8
    }
  }, "FOLLOW ME"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 120,
      height: 120,
      background: 'repeating-conic-gradient(#232838 0% 25%, #fff 0% 50%) 0 0/16px 16px',
      border: '4px solid #fff',
      boxShadow: 'var(--shadow-sm)'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      padding: '0 32px 16px'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "back",
    onClick: onBack
  })), /*#__PURE__*/React.createElement(Footer, null));
}
window.SpeakerPreviewChrome = Object.assign(window.SpeakerPreviewChrome || {}, {
  SpeakerScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/speaker-preview-manager/SpeakerScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/speaker-preview-manager/SplashScreen.jsx
try { (() => {
function SplashScreen({
  onPlay
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      background: '#f0f2f6',
      borderBottom: '1px solid var(--color-border)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      position: 'absolute',
      top: 24,
      right: 28,
      width: 46,
      height: 46,
      borderRadius: '50%',
      background: 'var(--color-accent)',
      border: 'none',
      color: '#fff',
      boxShadow: 'var(--shadow-btn)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "#fff",
    style: {
      margin: 'auto'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 8a4 4 0 100 8 4 4 0 000-8zm9 3.4l-1.9-.3a7.1 7.1 0 00-.6-1.5l1.1-1.6-1.5-1.5-1.6 1.1a7.1 7.1 0 00-1.5-.6L15 3H9l-.3 1.9c-.5.1-1 .3-1.5.6L5.6 4.4 4.1 5.9l1.1 1.6c-.3.5-.5 1-.6 1.5L3 9.4v5.2l1.9.3c.1.5.3 1 .6 1.5l-1.1 1.6 1.5 1.5 1.6-1.1c.5.3 1 .5 1.5.6L9 21h6l.3-1.9c.5-.1 1-.3 1.5-.6l1.6 1.1 1.5-1.5-1.1-1.6c.3-.5.5-1 .6-1.5l1.9-.3z"
  }))), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo_octopus.png",
    style: {
      height: 160
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onPlay,
    style: {
      width: 76,
      height: 76,
      borderRadius: '50%',
      background: 'var(--color-accent)',
      border: 'none',
      boxShadow: 'var(--shadow-btn)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "26",
    height: "26",
    viewBox: "0 0 24 24",
    fill: "#fff"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 5l12 7-12 7z"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      background: 'var(--color-brand-primary)'
    }
  }));
}
window.SpeakerPreviewChrome = Object.assign(window.SpeakerPreviewChrome || {}, {
  SplashScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/speaker-preview-manager/SplashScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.ScheduleTable = __ds_scope.ScheduleTable;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.SocialIcons = __ds_scope.SocialIcons;

})();
