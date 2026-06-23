import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import ArrowLeftIcon from "../icons/ArrowLeftIcon";
import ProjectCard from "../contracts/ProjectCard";

// =================== SECTION ===================
export default function ActiveProjectsSection({ activeContracts }) {
  const navigate = useNavigate();
  const previousButtonRef = useRef(null);
  const nextButtonRef = useRef(null);

  if (!activeContracts || activeContracts.length === 0) return null;

  return (
    <div className="flex flex-col font-sans gap-3">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-medium text-text-primary">
            Active Projects
          </h2>
          <p className="text-xs font-normal text-text-placeholder mt-2">
            Showing all currently active projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            ref={previousButtonRef}
            type="button"
            aria-label="Show previous projects"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-primary bg-bg-cards1 text-primary transition-colors duration-200 hover:bg-primary hover:text-white [&.swiper-button-disabled]:pointer-events-none [&.swiper-button-disabled]:border-gray-200 [&.swiper-button-disabled]:text-gray-200"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <button
            ref={nextButtonRef}
            type="button"
            aria-label="Show next projects"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-primary bg-bg-cards1 text-primary transition-colors duration-200 hover:bg-primary hover:text-white [&.swiper-button-disabled]:pointer-events-none [&.swiper-button-disabled]:border-gray-200 [&.swiper-button-disabled]:text-gray-200"
          >
            <ArrowLeftIcon className="h-5 w-5 rotate-180" />
          </button>
        </div>
      </div>

      {/* Scrollable cards */}
      <Swiper
        modules={[Navigation]}
        navigation={{
          prevEl: previousButtonRef.current,
          nextEl: nextButtonRef.current,
        }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = previousButtonRef.current;
          swiper.params.navigation.nextEl = nextButtonRef.current;
        }}
        className="w-full"
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{
          1024: {
            slidesPerView: 3,
          },
        }}
      >
        {activeContracts.map((contract) => (
          <SwiperSlide key={contract.id}>
            <ProjectCard
              contract={contract}
              onClick={() => {
                navigate(`/contracts/${contract.id}`);
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
