'use client';

export default function AboutPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: "url('/images/nyc-neighborhood.jpg')", 
          filter: "brightness(0.55)" 
        }}
      />
      
      {/* Page Title */}
      <div className="relative z-10 pt-28 pb-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold font-display text-white tracking-tight">
          about localmart
        </h1>
        <div className="w-24 h-1 bg-[#2A9D8F] mx-auto mt-6 rounded-full"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Mission Section */}
          <section className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h2 className="text-2xl font-bold text-[#2D3748] mb-4 flex items-center">
              <span className="w-1.5 h-8 bg-[#2A9D8F] rounded-full mr-3"></span>
              Mission
            </h2>
            <p className="text-[#4A5568] text-lg">
              We're making it <span className="font-bold">as easy to order from local businesses</span> as it is from Amazon. People want to support 
              their neighborhood stores, but <span className="font-bold">big retailers have made convenience the deciding factor</span>. We're changing that.
            </p>
            <p className="text-[#4A5568] text-lg mt-4">
              Even Amazon and larger retailers <span className="font-bold">can't beat our local same-day delivery</span> when it comes to neighborhood shopping.
            </p>
          </section>

          {/* Our Plan Section */}
          <section className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h2 className="text-2xl font-bold text-[#2D3748] mb-4 flex items-center">
              <span className="w-1.5 h-8 bg-[#2A9D8F] rounded-full mr-3"></span>
              Our Plan
            </h2>
            <p className="text-[#4A5568] text-lg mb-4">
              We're starting with products that people <span className="font-bold">prefer to buy locally but can't easily get delivered</span>—coffee beans, 
              baby supplies, pet supplies, and craft supplies. By connecting these local businesses with their customers, 
              we <span className="font-bold">keep money in the community</span> and help neighborhood shops thrive.
            </p>
            <h3 className="text-lg font-semibold text-[#2D3748] mt-5 mb-2">How it works:</h3>
            <ul className="list-disc pl-5 text-[#4A5568] text-lg space-y-2">
              <li>List items from local stores in one convenient marketplace</li>
              <li>Ensure inventory is available</li>
              <li>Handle same-day or next-day delivery to your door</li>
            </ul>
          </section>

          {/* Who We Are Section */}
          <section className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h2 className="text-2xl font-bold text-[#2D3748] mb-4 flex items-center">
              <span className="w-1.5 h-8 bg-[#2A9D8F] rounded-full mr-3"></span>
              Who We Are
            </h2>
            <p className="text-[#4A5568] text-lg">
              We're <span className="font-bold">software engineers who live in Astoria</span> (and one of us was born right here in NYC). 
              We built LocalMart because we believe <span className="font-bold">communities are stronger when local shops succeed</span>.
            </p>
            <p className="text-[#4A5568] text-lg mt-4">
              We're friends who are passionate about our neighborhood and <span className="font-bold">have been organizing the Astoria Tech Meetup since 2019</span>. 
              Our team is small but mighty, and we're dedicated to making it easier for everyone to shop local.
            </p>
          </section>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="fixed bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/40 to-transparent z-5"></div>
    </main>
  );
} 