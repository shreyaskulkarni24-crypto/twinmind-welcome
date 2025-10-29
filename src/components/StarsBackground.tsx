import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

interface StarProps {
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: number;
  fallDuration: number;
}

const WebStar: React.FC<StarProps> = ({ x, y, size, opacity, animationDelay, fallDuration }) => {
  const starStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: 'white',
    opacity,
    // Web-specific CSS animations
    animationName: 'twinkle, fall',
    animationDuration: `3s, ${fallDuration}s`,
    animationIterationCount: 'infinite, infinite',
    animationTimingFunction: 'ease-in-out, linear',
    animationDelay: `${animationDelay}s, ${animationDelay}s`,
  }), [x, y, size, opacity, animationDelay, fallDuration]);

  return <View style={starStyle} />;
};

const MobileStar: React.FC<StarProps> = ({ x, y, size, opacity, animationDelay, fallDuration }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const twinkleOpacity = useRef(new Animated.Value(opacity)).current;

  useEffect(() => {
    // Delay the start of animation
    const startDelay = animationDelay * 1000;
    
    setTimeout(() => {
      // Falling animation
      const fall = () => {
        translateY.setValue(-100);
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: fallDuration * 1000,
          useNativeDriver: true,
        }).start(() => fall());
      };

      // Twinkling animation
      const twinkle = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(twinkleOpacity, {
              toValue: opacity * 0.3,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(twinkleOpacity, {
              toValue: opacity,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      fall();
      twinkle();
    }, startDelay);
  }, [translateY, twinkleOpacity, animationDelay, fallDuration, opacity]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'white',
          opacity: twinkleOpacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
};

// Choose the right star component based on platform
const Star = Platform.OS === 'web' ? WebStar : MobileStar;

export const StarsBackground: React.FC<{ count?: number }> = ({ count = 40 }) => {
  // Memoized stars for consistent performance
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      x: Math.random() * (width + 100) - 50,
      y: Math.random() * (height + 100) - 50,
      size: Math.random() * 2.5 + 0.8,
      opacity: Math.random() * 0.7 + 0.3,
      animationDelay: Math.random() * 15,
      fallDuration: Math.random() * 25 + 20,
    }));
  }, [count, width, height]);

  // Inject CSS animations for web platform only
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('stars-animations')) {
        const style = document.createElement('style');
        style.id = 'stars-animations';
        style.textContent = `
          @keyframes twinkle {
            0%, 100% { 
              opacity: 0.3;
              transform: scale(1);
            }
            25% { 
              opacity: 0.8;
              transform: scale(1.1);
            }
            50% { 
              opacity: 1;
              transform: scale(1.2);
            }
            75% { 
              opacity: 0.8;
              transform: scale(1.1);
            }
          }
          
          @keyframes fall {
            0% { 
              transform: translateY(-100vh) translateX(0px) rotate(0deg);
              opacity: 0;
            }
            10% { 
              opacity: 1;
            }
            90% { 
              opacity: 1;
            }
            100% { 
              transform: translateY(100vh) translateX(20px) rotate(180deg);
              opacity: 0;
            }
          }

          [style*="animationName"] {
            will-change: transform, opacity;
            transform: translateZ(0);
            backface-visibility: hidden;
          }

          @keyframes atmospherePulse {
            0%, 100% { 
              transform: scale(1) rotate(0deg);
              opacity: 0.035;
            }
            33% { 
              transform: scale(1.05) rotate(120deg);
              opacity: 0.06;
            }
            66% { 
              transform: scale(0.95) rotate(240deg);
              opacity: 0.02;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Multi-layer gradient background */}
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />
      
      {/* Stars Layer */}
      <View style={styles.starsContainer}>
        {stars.map((star) => (
          <Star key={star.id} {...star} />
        ))}
      </View>
      
      {/* Atmospheric Effects */}
      <View style={[styles.atmosphere1, Platform.OS === 'web' && styles.webAtmosphere]} />
      <View style={[styles.atmosphere2, Platform.OS === 'web' && styles.webAtmosphere]} />
      <View style={[styles.atmosphere3, Platform.OS === 'web' && styles.webAtmosphere]} />
      <View style={[styles.atmosphere4, Platform.OS === 'web' && styles.webAtmosphere]} />
      
      {/* Depth overlay */}
      <View style={styles.depthOverlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
  },
  gradientLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1e293b',
    opacity: 0.9,
  },
  gradientLayer3: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1e293b',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  atmosphere1: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    width: 280,
    height: 280,
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
    borderRadius: 140,
  },
  atmosphere2: {
    position: 'absolute',
    bottom: '15%',
    right: '8%',
    width: 350,
    height: 350,
    backgroundColor: 'rgba(147, 51, 234, 0.035)',
    borderRadius: 175,
  },
  atmosphere3: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    width: 500,
    height: 500,
    backgroundColor: 'rgba(99, 102, 241, 0.025)',
    borderRadius: 250,
    transform: [{ translateX: -250 }, { translateY: -250 }],
  },
  atmosphere4: {
    position: 'absolute',
    top: '20%',
    right: '20%',
    width: 200,
    height: 200,
    backgroundColor: 'rgba(34, 197, 94, 0.02)',
    borderRadius: 100,
  },
  webAtmosphere: {
    ...(Platform.OS === 'web' && {
      animationName: 'atmospherePulse',
      animationDuration: '10s',
      animationIterationCount: 'infinite',
      animationTimingFunction: 'ease-in-out',
    }),
  },
  depthOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    pointerEvents: 'none',
  },
});

export default StarsBackground;
