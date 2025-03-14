'use client';

import Avatar from 'boring-avatars';

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
      <div className="relative z-10 pt-28 pb-6 text-center">
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
              their neighborhood stores, but <span className="font-bold">big retailers have made convenience the deciding factor</span>.
            </p>
            <p className="text-[#4A5568] text-lg mt-2 font-bold">
              We're changing that.
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
              baby supplies, pet supplies, and craft supplies.
            </p>
            <p className="text-[#4A5568] text-lg mb-4">
              <span className="font-bold">By connecting these local businesses with their customers, we keep money in the community</span> and help neighborhood shops thrive.
            </p>
            <h3 className="text-lg font-semibold text-[#2D3748] mt-5 mb-2">How it works:</h3>
            <ul className="list-disc pl-5 text-[#4A5568] text-lg space-y-2">
              <li>List items from local stores in one convenient marketplace</li>
              <li>Ensure inventory is available</li>
              <li>Handle same-day or next-day delivery to your door</li>
            </ul>
          </section>

          {/* Who We Are Section with Team Avatars */}
          <section className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            {/* Team Avatars */}
            <div className="flex justify-center -mt-16 mb-6 space-x-3 md:space-x-4">
              {/* Carlos - white passing Hispanic with short hair */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#2A9D8F]/20 p-1 backdrop-blur-sm border-2 border-[#2A9D8F]/30 overflow-hidden transform transition-transform hover:scale-110 hover:border-[#2A9D8F]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <Avatar
                      size="100%"
                      name="Carlos Rodriguez"
                      variant="beam"
                      colors={["#2A9D8F", "#F9C9B6", "#FF6B6B", "#4ECDC4", "#FFD166"]}
                    />
                  </div>
                </div>
                <span className="text-[#2D3748] text-xs mt-1 font-medium">Carlos</span>
              </div>
              
              {/* David - slightly darker with dark hair */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#2A9D8F]/20 p-1 backdrop-blur-sm border-2 border-[#2A9D8F]/30 overflow-hidden transform transition-transform hover:scale-110 hover:border-[#2A9D8F]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <Avatar
                      size="100%"
                      name="David Johnson"
                      variant="sunset"
                      colors={["#3A86FF", "#D08B5B", "#8338EC", "#2A9D8F", "#FB5607"]}
                    />
                  </div>
                </div>
                <span className="text-[#2D3748] text-xs mt-1 font-medium">David</span>
              </div>
              
              {/* Jawaun - longer hair and darker skin */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#2A9D8F]/20 p-1 backdrop-blur-sm border-2 border-[#2A9D8F]/30 overflow-hidden transform transition-transform hover:scale-110 hover:border-[#2A9D8F]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <Avatar
                      size="100%"
                      name="Jawaun Williams"
                      variant="marble"
                      colors={["#AE5D29", "#06D6A0", "#118AB2", "#073B4C", "#FFD166"]}
                    />
                  </div>
                </div>
                <span className="text-[#2D3748] text-xs mt-1 font-medium">Jawaun</span>
              </div>
              
              {/* Peter - white passing Hispanic with short hair */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#2A9D8F]/20 p-1 backdrop-blur-sm border-2 border-[#2A9D8F]/30 overflow-hidden transform transition-transform hover:scale-110 hover:border-[#2A9D8F]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <Avatar
                      size="100%"
                      name="Peter Valdez"
                      variant="pixel"
                      colors={["#2A9D8F", "#EDB98A", "#FF9F1C", "#E71D36", "#011627"]}
                    />
                  </div>
                </div>
                <span className="text-[#2D3748] text-xs mt-1 font-medium">Peter</span>
              </div>
              
              {/* Rena - Asian girl */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#2A9D8F]/20 p-1 backdrop-blur-sm border-2 border-[#2A9D8F]/30 overflow-hidden transform transition-transform hover:scale-110 hover:border-[#2A9D8F]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <Avatar
                      size="100%"
                      name="Rena Kim"
                      variant="bauhaus"
                      colors={["#F8D25C", "#F72585", "#7209B7", "#4CC9F0", "#2A9D8F"]}
                    />
                  </div>
                </div>
                <span className="text-[#2D3748] text-xs mt-1 font-medium">Rena</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-[#2D3748] mb-4 flex items-center">
              <span className="w-1.5 h-8 bg-[#2A9D8F] rounded-full mr-3"></span>
              Who We Are
            </h2>
            <p className="text-[#4A5568] text-lg">
              We're a group of software engineers who live in Queens (and one of us was even born right here in NYC!). 
            </p>
            <p className="text-[#4A5568] text-lg mt-3">
              We love our neighborhood and believe that <span className="font-bold">local shops are what make our community special</span>. That's why we built Localmart — to help these businesses thrive in the digital age.
            </p>
            <p className="text-[#4A5568] text-lg mt-3">
              When we're not coding, you'll find us running the <span className="font-bold">Astoria Tech Meetup</span>, which we've been organizing since 2019. Drop by sometime and say hello! We're a friendly bunch passionate about tech and community.
            </p>
            <p className="text-[#4A5568] text-lg mt-3">
              Our small but mighty team is dedicated to making it easier for everyone to shop local. We hope you'll join us!
            </p>
          </section>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="fixed bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/40 to-transparent z-5"></div>
    </main>
  );
}