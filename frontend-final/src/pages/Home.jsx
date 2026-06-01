import React from 'react'
import Hero from '../components/Hero'
import Products from '../components/Products'
import BestSellerSlider from '../components/BestSellerSlider'
import ProductsDiscover from '../components/ProductsDiscover'

const Home = () => {
    return (
        <main className="overflow-x-hidden">
            <Hero />
            <Products />
            <BestSellerSlider />
            <ProductsDiscover />
        </main>
    )
}

export default Home
