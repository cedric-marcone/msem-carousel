import React from "react";
import Carousel from "./Carousel";
import "./App.css";

const host = "https://phototheque.mon-sejour-en-montagne.com";
const prefix = `${host}/images/msem/1920_946/`;
const slides = [
  { text: "Photo 1", img: "home-bg.jpg" },
  { text: "Photo 2", img: "home-bg-accommodation-1.jpg" },
  { text: "Photo 3", img: "home-bg-skipasses-1.jpg" }
];
const App = () => {
  return (
    <div className="App">
      <div className="carousel-outer">
        <Carousel
          auto
          prevButton={
            <button className="carousel__button carousel__button--left">
              <svg className="carousel__icon" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
          }
          nextButton={
            <button className="carousel__button carousel__button--right">
              <svg className="carousel__icon" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          }
          navigation={
            <div className="">
              {slides.map((_, index) => (
                <button key={index}>{index}</button>
              ))}
            </div>
          }
        >
          {slides.map((slide, index) => (
            <div className="slide" key={index}>
              <div className="text">{slide.text}</div>
              <img src={`${prefix}${slide.img}`} alt="" />
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default App;
