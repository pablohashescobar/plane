import * as React from "react";

import { ISvgIcons } from "./type";

export const PhotoFilterIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} stroke-2`}
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 3L18.5778 4.28889C18.5562 4.35583 18.519 4.41668 18.4692 4.46643C18.4195 4.51619 18.3587 4.55344 18.2918 4.57511L17 5L18.2889 5.42222C18.3558 5.44384 18.4167 5.48104 18.4664 5.53076C18.5162 5.58048 18.5534 5.6413 18.5751 5.70822L19 7L19.4222 5.71111C19.4438 5.64417 19.481 5.58332 19.5308 5.53357C19.5805 5.48381 19.6413 5.44656 19.7082 5.42489L21 5L19.7111 4.57778C19.6442 4.55616 19.5833 4.51896 19.5336 4.46924C19.4838 4.41952 19.4466 4.3587 19.4249 4.29178L19 3Z"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 9L11.3667 10.9333C11.3342 11.0337 11.2784 11.125 11.2039 11.1997C11.1293 11.2743 11.038 11.3302 10.9377 11.3627L9 12L10.9333 12.6333C11.0337 12.6658 11.125 12.7216 11.1997 12.7961C11.2743 12.8707 11.3302 12.962 11.3627 13.0623L12 15L12.6333 13.0667C12.6658 12.9663 12.7216 12.875 12.7961 12.8003C12.8707 12.7257 12.962 12.6698 13.0623 12.6373L15 12L13.0667 11.3667C12.9663 11.3342 12.875 11.2784 12.8003 11.2039C12.7257 11.1293 12.6698 11.038 12.6373 10.9377L12 9Z"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);