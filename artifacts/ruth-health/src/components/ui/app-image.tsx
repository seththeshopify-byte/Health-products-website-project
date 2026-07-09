import { useState } from "react";
import { cn } from "@/lib/utils";

interface AppImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'supplement' | 'device' | 'consultation' | 'course';
}

const FALLBACKS = {
  supplement: '/attached_assets/generated_images/supplement.jpg',
  device: '/attached_assets/generated_images/device.jpg',
  consultation: '/attached_assets/generated_images/consultation.jpg',
  course: '/attached_assets/generated_images/course.jpg',
};

export function AppImage({ src, fallbackType = 'supplement', className, ...props }: AppImageProps) {
  const [error, setError] = useState(false);
  const finalSrc = error || !src ? FALLBACKS[fallbackType] : src;
  
  return (
    <img 
      src={finalSrc} 
      onError={() => setError(true)} 
      className={cn("object-cover", className)}
      {...props} 
    />
  );
}
