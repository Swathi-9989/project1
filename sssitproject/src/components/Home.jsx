import React, { useEffect, useState } from "react";

export default function Home() {
  const images = [
  new URL("../assets/pic1.webp", import.meta.url).href,
  new URL("../assets/pic3.webp", import.meta.url).href,
  new URL("../assets/pic4.webp", import.meta.url).href,
  new URL("../assets/WP1.webp", import.meta.url).href,
  new URL("../assets/W2.webp", import.meta.url).href,
  new URL("../assets/W3.webp", import.meta.url).href,
];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

 return (
  <div className="slider-wrapper">
    <div
      className="slider-track"
      style={{ transform: `translateX(-${currentIndex * 100}%)` }}
    >
      {images.map((img, index) => (
  <img
    key={index}
    src={img}
    alt="SSSIT Computer Education"
    width="1200"
    height="600"
    fetchPriority={index === 0 ? "high" : "low"}
    loading={index === 0 ? "eager" : "lazy"}
    decoding="async"
  />
))}

    </div>
  </div>
);

}

