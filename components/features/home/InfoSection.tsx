interface InfoSectionProps {
  title: string;
  content: string[];
}

export default function InfoSection({ title, content }: InfoSectionProps) {
  return (
    <section className="py-12 sm:py-16 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-start lg:justify-between">
          <div className="lg:w-1/3 mb-6 lg:mb-0">
            <div className="h-1 w-20 bg-primary mb-4"></div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          </div>
          <div className="lg:w-2/3 space-y-6">
            {content.map((paragraph, index) => (
              <p
                key={index}
                className="text-base sm:text-lg text-muted-foreground leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
