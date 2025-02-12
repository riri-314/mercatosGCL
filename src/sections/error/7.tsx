import { useEffect } from 'react';

export default function BeerRain() {
  useEffect(() => {
    const interval = setInterval(() => {
      const beer = document.createElement('div');
      beer.innerText = '7️';
      beer.style.position = 'fixed';
      beer.style.zIndex = '9999';
      beer.style.fontSize = `${Math.random() * 50 + 10}px`;
      beer.style.top = `${-100}px`;
      beer.style.left = `${Math.random() * window.innerWidth}px`;
      beer.style.animation = 'fall 2s linear infinite';
      document.body.appendChild(beer);

      setTimeout(() => {
        beer.remove();
      }, 2000);
    }, 70);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <style>
        {`
          @keyframes fall {
            to {
              transform: translateY(${window.innerHeight}px);
            }
          }
        `}
      </style>
    </div>
  );
}