import React, { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import { motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiLoader } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { fetchSliders } from "../store/slices/sliderSlice";
import { resolveUploadUrl } from "../api/axios";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

export default function Hero() {
    const dispatch = useDispatch();
    const { items: sliders, loading } = useSelector((state) => state.slider);

    useEffect(() => {
        dispatch(fetchSliders());
    }, [dispatch]);

    if (loading && sliders.length === 0) {
        return (
            <div className="h-[75vh] min-h-[600px] flex items-center justify-center bg-luxury-light">
                <FiLoader className="animate-spin text-brown" size={40} />
            </div>
        );
    }

    // fallback if no sliders and not loading
    const displaySliders = sliders.length > 0 ? sliders : [
        {
            id: 'fallback-1',
            title: "Roots. Redefined.",
            url: "/home.png",
            type: 'image'
        }
    ];

    return (
        <section className="relative h-[50vh] sm:h-[80vh] overflow-hidden group/hero mt-30">
            <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectFade]}
                effect="fade"
                navigation={{
                    prevEl: ".hero-prev-btn",
                    nextEl: ".hero-next-btn",
                }}
                pagination={{
                    clickable: true,
                    renderBullet: (index, className) => {
                        return `<span class="${className}"></span>`;
                    }
                }}
                autoplay={{ delay: 6000, disableOnInteraction: false }}
                loop={displaySliders.length > 1}
                className="h-full w-full"
            >
                {displaySliders.map((slide) => (
                    <SwiperSlide key={slide.id}>
                        <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
                            {/* Background Image/Video with Zoom Animation */}
                            <motion.div
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 10, ease: "linear" }}
                                className="absolute inset-0 z-0"
                            >
                                {slide.type === 'video' ? (
                                    <video
                                        src={resolveUploadUrl(slide.url)}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={resolveUploadUrl(slide.url)}
                                        className="w-full h-full object-cover"
                                        alt={slide.title}
                                    />
                                )}
                                {/* Dynamic Gradient Overlay */}
                                <div className="absolute inset-0 bg-linear-to-r from-brown/80 via-brown/20 to-transparent" />
                                <div className="absolute inset-0 bg-black/20" />
                            </motion.div>

                            <div className="relative z-10 w-full h-full flex items-center justify-center px-6">
                                <div className="max-w-7xl w-full">
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.5 }}
                                        className="max-w-2xl"
                                    >
                                        <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-4">
                                            {slide.title}
                                        </h2>
                                        <p className="text-white/80 text-lg md:text-xl font-bold max-w-lg mb-8">
                                            {slide.description}
                                        </p>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Custom Navigation Buttons */}
            <button
                className="hero-prev-btn absolute left-8 top-1/2 -translate-y-1/2 z-60 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-luxury-light/10 backdrop-blur-3xl border border-white/20 text-white transition-all duration-500 hover:bg-gold hover:border-gold hover:scale-110 hover:shadow-2xl hover:shadow-gold/40 shadow-xl opacity-0 translate-x-10 group-hover/hero:opacity-100 group-hover/hero:translate-x-0"
            >
                <FiChevronLeft size={32} />
            </button>
            <button
                className="hero-next-btn absolute right-8 top-1/2 -translate-y-1/2 z-60 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-luxury-light/10 backdrop-blur-3xl border border-white/20 text-white transition-all duration-500 hover:bg-gold hover:border-gold hover:scale-110 hover:shadow-2xl hover:shadow-gold/40 shadow-xl opacity-0 -translate-x-10 group-hover/hero:opacity-100 group-hover/hero:translate-x-0"
            >
                <FiChevronRight size={32} />
            </button>

            {/* Wavy Divider */}
            <div className="absolute bottom-0 left-0 w-full h-24 md:h-32 bg-luxury-light wavy-bottom z-50 pointer-events-none" />


        </section>
    );
}
