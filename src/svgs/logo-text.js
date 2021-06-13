import * as React from "react";

function SvgLogoText(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 185 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M.48 19.88c0-2.213.453-4.173 1.36-5.88.933-1.707 2.187-3.027 3.76-3.96 1.6-.96 3.36-1.44 5.28-1.44 1.733 0 3.24.347 4.52 1.04 1.307.667 2.347 1.507 3.12 2.52v-3.2h4.6V31h-4.6v-3.28c-.773 1.04-1.827 1.907-3.16 2.6-1.333.693-2.853 1.04-4.56 1.04-1.893 0-3.627-.48-5.2-1.44-1.573-.987-2.827-2.347-3.76-4.08C.933 24.08.48 22.093.48 19.88zm18.04.08c0-1.52-.32-2.84-.96-3.96-.613-1.12-1.427-1.973-2.44-2.56a6.436 6.436 0 00-3.28-.88 6.436 6.436 0 00-3.28.88c-1.013.56-1.84 1.4-2.48 2.52-.613 1.093-.92 2.4-.92 3.92s.307 2.853.92 4c.64 1.147 1.467 2.027 2.48 2.64a6.58 6.58 0 003.28.88 6.436 6.436 0 003.28-.88c1.013-.587 1.827-1.44 2.44-2.56.64-1.147.96-2.48.96-4zm30.15-11V31h-4.56v-2.6c-.72.907-1.667 1.627-2.84 2.16a9.003 9.003 0 01-3.68.76c-1.734 0-3.294-.36-4.68-1.08-1.36-.72-2.44-1.787-3.24-3.2-.774-1.413-1.16-3.12-1.16-5.12V8.96h4.52v12.28c0 1.973.493 3.493 1.48 4.56.986 1.04 2.333 1.56 4.04 1.56 1.706 0 3.053-.52 4.04-1.56 1.013-1.067 1.52-2.587 1.52-4.56V8.96h4.56zm10.936 3.72v12.2c0 .827.187 1.427.56 1.8.4.347 1.067.52 2 .52h2.8V31h-3.6c-2.053 0-3.627-.48-4.72-1.44s-1.64-2.52-1.64-4.68v-12.2h-2.6V8.96h2.6V3.48h4.6v5.48h5.36v3.72h-5.36zm18.723 18.68c-2.08 0-3.96-.467-5.64-1.4-1.68-.96-3-2.293-3.96-4-.96-1.733-1.44-3.733-1.44-6 0-2.24.493-4.227 1.48-5.96.986-1.733 2.333-3.067 4.04-4 1.706-.933 3.613-1.4 5.72-1.4 2.106 0 4.013.467 5.72 1.4 1.706.933 3.053 2.267 4.04 4 .986 1.733 1.48 3.72 1.48 5.96 0 2.24-.507 4.227-1.52 5.96a10.63 10.63 0 01-4.16 4.04c-1.734.933-3.654 1.4-5.76 1.4zm0-3.96c1.173 0 2.266-.28 3.28-.84 1.04-.56 1.88-1.4 2.52-2.52.64-1.12.96-2.48.96-4.08s-.307-2.947-.92-4.04c-.614-1.12-1.427-1.96-2.44-2.52a6.673 6.673 0 00-3.28-.84c-1.174 0-2.267.28-3.28.84-.987.56-1.774 1.4-2.36 2.52-.587 1.093-.88 2.44-.88 4.04 0 2.373.6 4.213 1.8 5.52 1.226 1.28 2.76 1.92 4.6 1.92zm24.788-14.72h-4.08V31h-4.6V12.68h-2.6V8.96h2.6V7.4c0-2.533.666-4.373 2-5.52 1.36-1.173 3.48-1.76 6.36-1.76v3.8c-1.387 0-2.36.267-2.92.8-.56.507-.84 1.4-.84 2.68v1.56h4.08v3.72zm2.121 7.2c0-2.213.453-4.173 1.36-5.88.933-1.707 2.186-3.027 3.76-3.96 1.6-.96 3.36-1.44 5.28-1.44 1.733 0 3.24.347 4.52 1.04 1.306.667 2.346 1.507 3.12 2.52v-3.2h4.6V31h-4.6v-3.28c-.774 1.04-1.827 1.907-3.16 2.6-1.334.693-2.854 1.04-4.56 1.04-1.894 0-3.627-.48-5.2-1.44-1.574-.987-2.827-2.347-3.76-4.08-.907-1.76-1.36-3.747-1.36-5.96zm18.04.08c0-1.52-.32-2.84-.96-3.96-.614-1.12-1.427-1.973-2.44-2.56a6.438 6.438 0 00-3.28-.88 6.433 6.433 0 00-3.28.88c-1.014.56-1.84 1.4-2.48 2.52-.614 1.093-.92 2.4-.92 3.92s.306 2.853.92 4c.64 1.147 1.466 2.027 2.48 2.64 1.04.587 2.133.88 3.28.88a6.438 6.438 0 003.28-.88c1.013-.587 1.826-1.44 2.44-2.56.64-1.147.96-2.48.96-4zm14.749-7.8c.667-1.12 1.547-1.987 2.64-2.6 1.12-.64 2.44-.96 3.96-.96v4.72h-1.16c-1.786 0-3.146.453-4.08 1.36-.906.907-1.36 2.48-1.36 4.72V31h-4.56V8.96h4.56v3.2zm37.072-3.56c1.733 0 3.28.36 4.64 1.08 1.386.72 2.466 1.787 3.24 3.2.8 1.413 1.2 3.12 1.2 5.12v13h-4.52V18.68c0-1.973-.494-3.48-1.48-4.52-.987-1.067-2.334-1.6-4.04-1.6-1.707 0-3.067.533-4.08 1.6-.987 1.04-1.48 2.547-1.48 4.52V31h-4.52V18.68c0-1.973-.494-3.48-1.48-4.52-.987-1.067-2.334-1.6-4.04-1.6-1.707 0-3.067.533-4.08 1.6-.987 1.04-1.48 2.547-1.48 4.52V31h-4.56V8.96h4.56v2.52c.746-.907 1.693-1.613 2.84-2.12a9 9 0 013.68-.76c1.76 0 3.333.373 4.72 1.12a7.662 7.662 0 013.2 3.24c.666-1.333 1.706-2.387 3.12-3.16a9.105 9.105 0 014.56-1.2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgLogoText;

