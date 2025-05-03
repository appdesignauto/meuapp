import { useQuery } from '@tanstack/react-query';
import { Star, StarHalf } from 'lucide-react';
import { Testimonial } from '@/types';

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  // Helper function to render stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-current text-secondary-500" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-current text-secondary-500" />);
    }

    return stars;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
      <div className="flex items-center mb-4">
        <div className="text-secondary-500 flex">
          {renderStars(testimonial.rating)}
        </div>
      </div>
      <p className="text-neutral-700 mb-6">
        {testimonial.quote}
      </p>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-neutral-200 mr-3 overflow-hidden">
          <img 
            src={testimonial.avatarUrl} 
            alt={`Foto de ${testimonial.name}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-designautoimages.com/api/?name=${encodeURIComponent(testimonial.name)}&background=random`;
            }} 
          />
        </div>
        <div>
          <h4 className="font-medium text-neutral-800">{testimonial.name}</h4>
          <p className="text-sm text-neutral-500">{testimonial.role}, {testimonial.company}</p>
        </div>
      </div>
    </div>
  );
};

const Testimonials = () => {
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials'],
  });

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-800 mb-4">Depoimentos de vendedores</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Veja como o DesignAuto App tem ajudado vendedores de automóveis a melhorar seus resultados.
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 w-4 mr-1 bg-neutral-200 rounded-full" />
                    ))}
                  </div>
                </div>
                <div className="h-20 bg-neutral-200 rounded mb-6" />
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-neutral-300 mr-3" />
                  <div>
                    <div className="h-4 bg-neutral-200 rounded w-24 mb-1" />
                    <div className="h-3 bg-neutral-200 rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials?.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
