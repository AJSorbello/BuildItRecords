import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const wave = keyframes`
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1.5); }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
`;

const WaveContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  height: 40px;
`;

const Bar = styled.div`
  width: 3px;
  height: 20px;
  background-color: #007AFF;
  border-radius: 3px;
  animation: ${wave} 1.5s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const LoadingAnimation = () => {
  return (
    <Container>
      <WaveContainer>
        {[...Array(5)].map((_, i) => (
          <Bar key={i} delay={i * 0.15} />
        ))}
      </WaveContainer>
    </Container>
  );
};

export default LoadingAnimation;
