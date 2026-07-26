type LogoMarkProps = {
  className?: string;
  strokeColor?: string;
  title?: string;
};

export function LogoMark({
  className = "",
  strokeColor = "currentColor",
  title = "OpportunIQ",
}: LogoMarkProps) {
  return (
    <svg
      viewBox="24 4 208 244"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      <path
        d="M78 60C58.92 72.39 44.73 91.06 37.9 112.77C31.06 134.48 32.01 157.88 40.57 178.97C49.12 200.05 64.76 217.51 84.8 228.31C104.84 239.11 127.98 242.61 150.33 238.23"
        stroke={strokeColor}
        strokeWidth="16.5"
        strokeLinecap="round"
      />
      <path
        d="M178 60C197.11 72.44 211.29 91.19 218.05 112.98C224.81 134.78 223.73 158.23 214.98 179.31C206.22 200.38 190.31 217.78 170.03 228.44C149.76 239.09 126.48 242.36 104.07 237.75"
        stroke={strokeColor}
        strokeWidth="16.5"
        strokeLinecap="round"
      />
      <path
        d="M128 106V212"
        stroke={strokeColor}
        strokeWidth="16.5"
        strokeLinecap="round"
      />
      <path
        d="M154 192L187 238"
        stroke={strokeColor}
        strokeWidth="16.5"
        strokeLinecap="round"
      />
      <path
        d="M107 81C120.25 72.62 135.75 72.62 149 81"
        stroke={strokeColor}
        strokeWidth="12.5"
        strokeLinecap="round"
      />
      <path
        d="M98 56C117.89 45.06 138.11 45.06 158 56"
        stroke={strokeColor}
        strokeWidth="12.5"
        strokeLinecap="round"
      />
      <path
        d="M89 33C114.33 20.33 141.67 20.33 167 33"
        stroke={strokeColor}
        strokeWidth="12.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
