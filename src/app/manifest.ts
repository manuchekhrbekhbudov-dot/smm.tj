import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SMM.TJ",
    short_name: "SMM.TJ",
    description: "Бозори мутахассисони SMM дар Тоҷикистон",
    start_url: "./tg/",
    display: "standalone",
    background_color: "#05010A",
    theme_color: "#05010A",
    icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
