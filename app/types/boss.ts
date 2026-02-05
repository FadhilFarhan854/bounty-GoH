import { StaticImageData } from "next/image";

export interface Boss {
    id: string;
    name: string;
    image: string;
    bounty: string;
    description?: string;
}
