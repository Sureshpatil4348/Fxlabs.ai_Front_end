/**
 * TradingView-like Drawing Tools Business Logic Example
 * 
 * This file demonstrates how to use the complete business logic system
 * for drawing tools with proper coordinate conversion, validation, and storage.
 */

import { DrawingService } from '../services/drawingService';
import { DrawingManager } from '../services/drawingManager';
import { 
  PixelPoint, 
  ChartDimensions
} from '../types/drawing';

// Example usage of the drawing business logic
export class DrawingBusinessLogicExample {
  private drawingService: DrawingService;
  private drawingManager: DrawingManager;

  constructor() {
    this.drawingService = DrawingService.getInstance();
    this.drawingManager = DrawingManager.getInstance();
  }

  /**
   * Example 1: Basic Drawing Creation
   */
  public createBasicDrawings() {
    console.log('=== Creating Basic Drawings ===');

    // Define chart dimensions (example data)
    const chartDimensions: ChartDimensions = {
      width: 800,
      height: 400,
      minPrice: 40000,
      maxPrice: 50000,
      minTime: 1640995200, // Jan 1, 2022
      maxTime: 1641081600, // Jan 2, 2022
      priceRange: 10000,
      timeRange: 86400 // 24 hours in seconds
    };

    const currentPrice = 45000;

    // Example 1: Create a Trend Line
    console.log('\n1. Creating Trend Line...');
    const trendLineStart: PixelPoint = { x: 100, y: 300 }; // Bottom left
    const trendLineEnd: PixelPoint = { x: 700, y: 100 };   // Top right

    const trendLine = this.drawingService.createDrawing(
      'TrendLine',
      trendLineStart,
      trendLineEnd,
      chartDimensions
    );

    if (trendLine) {
      console.log('Trend Line Created:', {
        toolType: trendLine.toolType,
        start: trendLine.start,
        end: trendLine.end,
        meta: {
          slope: trendLine.meta.slope,
          angle: trendLine.meta.angle,
          trendType: trendLine.meta.trendType,
          length: trendLine.meta.length
        }
      });
    }

    // Example 2: Create a Horizontal Line
    console.log('\n2. Creating Horizontal Line...');
    const horizontalStart: PixelPoint = { x: 200, y: 200 };
    const horizontalEnd: PixelPoint = { x: 600, y: 200 };

    const horizontalLine = this.drawingService.createDrawing(
      'HorizontalLine',
      horizontalStart,
      horizontalEnd,
      chartDimensions,
      currentPrice
    );

    if (horizontalLine) {
      console.log('Horizontal Line Created:', {
        toolType: horizontalLine.toolType,
        priceLevel: horizontalLine.meta.priceLevel,
        levelType: horizontalLine.meta.levelType,
        start: horizontalLine.start,
        end: horizontalLine.end
      });
    }

    // Example 3: Create Fibonacci Retracement
    console.log('\n3. Creating Fibonacci Retracement...');
    const fibStart: PixelPoint = { x: 150, y: 350 }; // Low point
    const fibEnd: PixelPoint = { x: 650, y: 150 };   // High point

    const fibonacci = this.drawingService.createDrawing(
      'Fibonacci',
      fibStart,
      fibEnd,
      chartDimensions
    );

    if (fibonacci) {
      console.log('Fibonacci Retracement Created:', {
        toolType: fibonacci.toolType,
        highPoint: fibonacci.meta.highPoint,
        lowPoint: fibonacci.meta.lowPoint,
        retracementDirection: fibonacci.meta.retracementDirection,
        retracementLevels: fibonacci.meta.retracementLevels
      });
    }
  }

  /**
   * Example 2: Drawing Manager Workflow
   */
  public demonstrateDrawingManagerWorkflow() {
    console.log('\n=== Drawing Manager Workflow ===');

    const chartDimensions: ChartDimensions = {
      width: 800,
      height: 400,
      minPrice: 40000,
      maxPrice: 50000,
      minTime: 1640995200,
      maxTime: 1641081600,
      priceRange: 10000,
      timeRange: 86400
    };

    // Step 1: Set active tool
    console.log('\n1. Setting active tool to TrendLine...');
    this.drawingManager.setActiveTool('TrendLine');

    // Step 2: Simulate first click
    console.log('2. First click (start point)...');
    const firstClick: PixelPoint = { x: 100, y: 300 };
    this.drawingManager.handleChartClick(firstClick, chartDimensions);

    // Step 3: Simulate second click
    console.log('3. Second click (end point)...');
    const secondClick: PixelPoint = { x: 700, y: 100 };
    const success = this.drawingManager.handleChartClick(secondClick, chartDimensions);

    if (success) {
      console.log('✅ Drawing completed successfully!');
    } else {
      console.log('❌ Drawing failed');
    }

    // Step 4: Check drawings
    const drawings = this.drawingService.getDrawings();
    console.log(`4. Total drawings: ${drawings.length}`);
  }

  /**
   * Example 3: Validation Examples
   */
  public demonstrateValidation() {
    console.log('\n=== Validation Examples ===');

    const chartDimensions: ChartDimensions = {
      width: 800,
      height: 400,
      minPrice: 40000,
      maxPrice: 50000,
      minTime: 1640995200,
      maxTime: 1641081600,
      priceRange: 10000,
      timeRange: 86400
    };

    // Example 1: Valid drawing
    console.log('\n1. Valid Trend Line:');
    const validStart: PixelPoint = { x: 100, y: 300 };
    const validEnd: PixelPoint = { x: 700, y: 100 };
    
    const validResult = this.drawingService.validateDrawing(
      validStart,
      validEnd,
      'TrendLine',
      chartDimensions
    );
    console.log('Validation result:', validResult);

    // Example 2: Invalid drawing (too short)
    console.log('\n2. Invalid Trend Line (too short):');
    const invalidStart: PixelPoint = { x: 100, y: 100 };
    const invalidEnd: PixelPoint = { x: 102, y: 102 }; // Only 2 pixels apart
    
    const invalidResult = this.drawingService.validateDrawing(
      invalidStart,
      invalidEnd,
      'TrendLine',
      chartDimensions
    );
    console.log('Validation result:', invalidResult);

    // Example 3: Invalid Fibonacci (insufficient price range)
    console.log('\n3. Invalid Fibonacci (insufficient price range):');
    const fibInvalidStart: PixelPoint = { x: 100, y: 200 };
    const fibInvalidEnd: PixelPoint = { x: 700, y: 201 }; // Very small price difference
    
    const fibInvalidResult = this.drawingService.validateDrawing(
      fibInvalidStart,
      fibInvalidEnd,
      'Fibonacci',
      chartDimensions
    );
    console.log('Validation result:', fibInvalidResult);
  }

  /**
   * Example 4: Coordinate Conversion
   */
  public demonstrateCoordinateConversion() {
    console.log('\n=== Coordinate Conversion Examples ===');

    const chartDimensions: ChartDimensions = {
      width: 800,
      height: 400,
      minPrice: 40000,
      maxPrice: 50000,
      minTime: 1640995200,
      maxTime: 1641081600,
      priceRange: 10000,
      timeRange: 86400
    };

    // Example 1: Pixel to Chart conversion
    console.log('\n1. Pixel to Chart Conversion:');
    const pixelPoint: PixelPoint = { x: 400, y: 200 }; // Center of chart
    const chartPoint = this.drawingService.pixelToChart(pixelPoint, chartDimensions);
    console.log(`Pixel (${pixelPoint.x}, ${pixelPoint.y}) -> Chart (time: ${chartPoint.time}, price: ${chartPoint.price})`);

    // Example 2: Chart to Pixel conversion
    console.log('\n2. Chart to Pixel Conversion:');
    const chartPoint2 = { time: 1641038400, price: 45000 }; // Middle time, middle price
    const pixelPoint2 = this.drawingService.chartToPixel(chartPoint2, chartDimensions);
    console.log(`Chart (time: ${chartPoint2.time}, price: ${chartPoint2.price}) -> Pixel (${pixelPoint2.x}, ${pixelPoint2.y})`);

    // Example 3: Round-trip conversion
    console.log('\n3. Round-trip Conversion Test:');
    const originalPixel: PixelPoint = { x: 300, y: 150 };
    const convertedChart = this.drawingService.pixelToChart(originalPixel, chartDimensions);
    const backToPixel = this.drawingService.chartToPixel(convertedChart, chartDimensions);
    
    const xDiff = Math.abs(originalPixel.x - backToPixel.x);
    const yDiff = Math.abs(originalPixel.y - backToPixel.y);
    
    console.log(`Original: (${originalPixel.x}, ${originalPixel.y})`);
    console.log(`Converted: (${backToPixel.x}, ${backToPixel.y})`);
    console.log(`Difference: (${xDiff.toFixed(2)}, ${yDiff.toFixed(2)})`);
    console.log(`Round-trip accurate: ${xDiff < 1 && yDiff < 1 ? '✅' : '❌'}`);
  }

  /**
   * Example 5: Storage and Persistence
   */
  public demonstrateStorage() {
    console.log('\n=== Storage and Persistence Examples ===');

    // Create some drawings
    const chartDimensions: ChartDimensions = {
      width: 800,
      height: 400,
      minPrice: 40000,
      maxPrice: 50000,
      minTime: 1640995200,
      maxTime: 1641081600,
      priceRange: 10000,
      timeRange: 86400
    };

    // Add drawings
    console.log('\n1. Adding drawings...');
    this.drawingManager.setActiveTool('TrendLine');
    this.drawingManager.handleChartClick({ x: 100, y: 300 }, chartDimensions);
    this.drawingManager.handleChartClick({ x: 700, y: 100 }, chartDimensions);

    this.drawingManager.setActiveTool('HorizontalLine');
    this.drawingManager.handleChartClick({ x: 200, y: 200 }, chartDimensions, 45000);

    // Get statistics
    console.log('\n2. Drawing Statistics:');
    const stats = this.drawingManager.getStatistics();
    console.log('Statistics:', stats);

    // Export drawings
    console.log('\n3. Exporting drawings...');
    const exportedData = this.drawingManager.exportDrawings();
    console.log('Exported data length:', exportedData.length, 'characters');

    // Clear all drawings
    console.log('\n4. Clearing all drawings...');
    this.drawingManager.clearAllDrawings();
    console.log('Drawings after clear:', this.drawingService.getDrawings().length);

    // Import drawings back
    console.log('\n5. Importing drawings back...');
    const importSuccess = this.drawingManager.importDrawings(exportedData);
    console.log('Import successful:', importSuccess);
    console.log('Drawings after import:', this.drawingService.getDrawings().length);
  }

  /**
   * Example 6: JSON Output Structure
   */
  public demonstrateJSONOutput() {
    console.log('\n=== JSON Output Structure Examples ===');

    const chartDimensions: ChartDimensions = {
      width: 800,
      height: 400,
      minPrice: 40000,
      maxPrice: 50000,
      minTime: 1640995200,
      maxTime: 1641081600,
      priceRange: 10000,
      timeRange: 86400
    };

    // Create a Trend Line
    const trendLine = this.drawingService.createDrawing(
      'TrendLine',
      { x: 100, y: 300 },
      { x: 700, y: 100 },
      chartDimensions
    );

    if (trendLine) {
      console.log('\n1. Trend Line JSON Structure:');
      console.log(JSON.stringify(trendLine, null, 2));
    }

    // Create a Horizontal Line
    const horizontalLine = this.drawingService.createDrawing(
      'HorizontalLine',
      { x: 200, y: 200 },
      { x: 600, y: 200 },
      chartDimensions,
      45000
    );

    if (horizontalLine) {
      console.log('\n2. Horizontal Line JSON Structure:');
      console.log(JSON.stringify(horizontalLine, null, 2));
    }

    // Create a Fibonacci Retracement
    const fibonacci = this.drawingService.createDrawing(
      'Fibonacci',
      { x: 150, y: 350 },
      { x: 650, y: 150 },
      chartDimensions
    );

    if (fibonacci) {
      console.log('\n3. Fibonacci Retracement JSON Structure:');
      console.log(JSON.stringify(fibonacci, null, 2));
    }
  }

  /**
   * Run all examples
   */
  public runAllExamples() {
    console.log('🚀 Starting TradingView Drawing Tools Business Logic Examples\n');
    
    this.createBasicDrawings();
    this.demonstrateDrawingManagerWorkflow();
    this.demonstrateValidation();
    this.demonstrateCoordinateConversion();
    this.demonstrateStorage();
    this.demonstrateJSONOutput();
    
    console.log('\n✅ All examples completed successfully!');
  }
}

// Example usage:
// const example = new DrawingBusinessLogicExample();
// example.runAllExamples();
