import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            data-logo="placement"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C7.6 2 4 5.6 4 10C4 15.8 10.6 21.2 11.5 22C11.8 22.3 12.2 22.3 12.5 22C13.4 21.2 20 15.8 20 10C20 5.6 16.4 2 12 2ZM9.2 8.2H11.3V10.3H9.2V8.2ZM12.7 8.2H14.8V10.3H12.7V8.2ZM9.2 11.7H11.3V13.8H9.2V11.7ZM12.7 11.7H14.8V13.8H12.7V11.7Z"
            />
        </svg>
    );
}
