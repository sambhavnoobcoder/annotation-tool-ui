import { useState, useEffect } from 'react'
// import { ChevronLeft, ChevronRight } from "react-feather"

const Carousel = ({ children: slides, autoSlide = false, autoSlideInterval = 3000 }) => {
    const [curr, setCurr] = useState(0)

    const prev = () => setCurr((curr) => (curr === 0 ? slides.length - 1 : curr - 1))

    const next = () => setCurr((curr) => (curr === slides.length - 1 ? 0 : curr + 1))

    useEffect(() => {
        if (!autoSlide) return
        const slideInterval = setInterval(next, autoSlideInterval)
        return () => clearInterval(slideInterval)
    }, [])


    return (
        <div className='overflow-hidden relative'>
            <div className='relative flex transition-transform ease-out duration-500 z-10' style={{ transform: `translateX(-${curr * 100}%)` }}>
                {slides}
            </div>
            <div style={{maxHeight : '10rem'}} className="absolute w-full top-1/2 -translate-y-1/2 left-0 flex items-center justify-between p-4 z-20">
                <button onClick={prev} className='w-8 h-8 font-bold rounded-full shadow bg-black/80 text-white hover:bg-black'>
                    {/* <ChevronLeft /> */} ＜
                </button>
                <button onClick={next} className='w-8 h-8 font-bold rounded-full shadow bg-black/80 text-white hover:bg-black'>
                    {/* <ChevronRight /> */} ＞
                </button>
            </div>
            <div className='absolute bottom-4 right-0 left-0'>
                <div className='flex items-center justify-center gap-2'>
                    {slides.map((s, i) => (
                        <div key={i} className={`transition-all w-1.5 h-1.5 bg-black rounded-full  ${curr === i ? "p-0.5" : "bg-opacity-50"}`} />
                    ))}
                </div>
            </div>
        </div>

    )
}

export default Carousel