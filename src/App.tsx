import React, { useEffect, useRef, useState } from 'react';
import { CircleSimulation } from './CircleSimulation';
import { Pause, Play, RotateCcw } from 'lucide-react';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<CircleSimulation | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [gravity, setGravity] = useState(0.4);
  const [velocityIncrease, setVelocityIncrease] = useState(0.02);
  const [velocityDecay, setVelocityDecay] = useState(0.998);
  const [ballGrowth, setBallGrowth] = useState(0.015);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const simulation = new CircleSimulation(canvasRef.current);
    simulationRef.current = simulation;
    simulation.start();

    return () => simulation.stop();
  }, []);

  const handlePlayPause = () => {
    if (!simulationRef.current) return;
    
    if (simulationRef.current.isRunning()) {
      simulationRef.current.stop();
      setIsRunning(false);
    } else {
      simulationRef.current.start();
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    if (!simulationRef.current) return;
    simulationRef.current.reset();
  };

  const handleGravityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setGravity(value);
    if (simulationRef.current) {
      simulationRef.current.setGravity(value);
    }
  };

  const handleVelocityIncreaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVelocityIncrease(value);
    if (simulationRef.current) {
      simulationRef.current.setVelocityIncrease(value);
    }
  };

  const handleVelocityDecayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVelocityDecay(value);
    if (simulationRef.current) {
      simulationRef.current.setVelocityDecay(value);
    }
  };

  const handleBallGrowthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBallGrowth(value);
    if (simulationRef.current) {
      simulationRef.current.setBallGrowthRate(value);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      <canvas 
        ref={canvasRef}
        width={1080}
        height={1920}
        className="max-h-screen w-auto"
      />
      
      {/* Controls Panel */}
      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handlePlayPause}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            {isRunning ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-white text-sm block mb-1">Gravity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={gravity}
              onChange={handleGravityChange}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-white text-sm block mb-1">Velocity Increase</label>
            <input
              type="range"
              min="0"
              max="0.1"
              step="0.01"
              value={velocityIncrease}
              onChange={handleVelocityIncreaseChange}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-white text-sm block mb-1">Velocity Decay</label>
            <input
              type="range"
              min="0.99"
              max="1"
              step="0.001"
              value={velocityDecay}
              onChange={handleVelocityDecayChange}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-white text-sm block mb-1">Ball Growth Rate</label>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.001"
              value={ballGrowth}
              onChange={handleBallGrowthChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
