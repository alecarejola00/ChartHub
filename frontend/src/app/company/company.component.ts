import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../services/data.service';
import { createChart, IChartApi, ColorType, CandlestickSeries, UTCTimestamp, CrosshairMode } from 'lightweight-charts';
import { SelectedCompanyService } from '../services/selected-company.services';
import { environment } from '../environments/environment';

interface PredictionImage {
  src: string;
  title: string;
  description: string;
  rmse: string;
  mae: string;
  r2: string;
}

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss'],
})
export class CompanyComponent implements OnInit, AfterViewInit {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
  chart: IChartApi | null = null;
  companySymbol!: string;
  companyName: string = '';
  stockData: any[] = [];
  rmseLabel: string = '';
  maeLabel: string = '';

  predictionImages: PredictionImage[] = [];
  selectedImage: PredictionImage | null = null;

  crosshairData: {
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    x?: number;
    y?: number;
    visible?: boolean;
  } = {};

  timeRanges = [
    { label: 'All Time', value: 'all' },
    { label: '1 Year', value: '1y' },
    { label: '6 Months', value: '6m' },
    { label: '3 Months', value: '3m' },
    { label: '30 Days', value: '1m' },
  ];
  selectedRange: string = 'all';

  R2Label: string = `Excellent: R² ≥ 0.9
  Good: 0.75 ≤ R² < 0.9
  Fair: 0.5 ≤ R² < 0.75
  Poor: R² < 0.5`;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private http: HttpClient,
    private selectedCompanyService: SelectedCompanyService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const symbol = params.get('symbol');
      if (symbol) {
        this.companySymbol = symbol;
        this.loadCompanyData();
      }
    });

    this.selectedCompanyService.selectedSymbol$.subscribe(symbol => {
      if (symbol && symbol !== this.companySymbol) {
        this.companySymbol = symbol;
        this.loadCompanyData();
      }
    });
  }

  ngAfterViewInit(): void {
    // Placeholder for after view init logic if needed
  }

  loadCompanyData(): void {
    this.loadPredictionImages();

    this.dataService.getCompanyBySymbol(this.companySymbol).subscribe(company => {
      this.companyName = company?.name ?? '';
    });

    this.dataService.getStockData(this.companySymbol).subscribe(
      (data) => {
        const mapped = data.map((d: any) => ({
          time: typeof d.time === 'string' ? Math.floor(new Date(d.time).getTime() / 1000) : d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
        }));

        mapped.sort((a: { time: number }, b: { time: number }) => a.time - b.time);

        const uniqueData: typeof mapped = [];
        let lastTime: number | null = null;
        for (const item of mapped) {
          if (item.time !== lastTime) {
            uniqueData.push(item);
            lastTime = item.time;
          }
        }

        this.stockData = uniqueData;

        this.loadPredictionImages();

        setTimeout(() => {
          if (this.chartContainer) {
            this.initializeChart();
          }
        }, 0);
      },
      (error) => {
        console.error('Error fetching stock data:', error);
      }
    );
  }

  initializeChart(): void {
    if (!this.chartContainer?.nativeElement) return;

    const chartOptions = {
      layout: {
        textColor: 'black',
        background: {
          type: ColorType.Solid,
          color: 'white',
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        visible: true,
        borderColor: '#ccc',
      },
      timeScale: {
        borderColor: '#ccc',
        timeVisible: true,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          });
        },
      },
    };

    if (this.chart) {
      try {
        this.chart.remove();
      } catch (err) {
        console.warn('Error disposing chart:', err);
      }
      this.chart = null;
    }

    this.chart = createChart(this.chartContainer.nativeElement, chartOptions);

    const container = this.chartContainer.nativeElement;
    this.chart.resize(container.clientWidth, container.clientHeight);

    const candlestickSeries = this.chart.addSeries(CandlestickSeries,{
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceFormat: {
        type: 'custom',
        minMove: 0.01,
        formatter: (price: number) => `₱${price.toFixed(2)}`,
      },
    });

    candlestickSeries.setData(this.stockData);
    this.chart.timeScale().fitContent();

    this.chart.subscribeCrosshairMove((param) => {
      if (
        param &&
        param.time &&
        param.seriesData &&
        param.seriesData.has(candlestickSeries)
      ) {
        const data = param.seriesData.get(candlestickSeries) as any;
        this.crosshairData = {
          time: new Date((param.time as number) * 1000).toLocaleDateString(),
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          x: param.point?.x ?? 0,
          y: param.point?.y ?? 0,
          visible: true,
        };
      } else {
        this.crosshairData.visible = false;
      }
    });
  }

  setTimeRange(range: string): void {
    this.selectedRange = range;

    if (!this.chart || !this.stockData.length) return;

    const lastDataPoint = this.stockData[this.stockData.length - 1];
    const endTime = lastDataPoint.time as UTCTimestamp;

    let startTime: UTCTimestamp;

    switch (range) {
      case '1y':
        startTime = (endTime - 365 * 24 * 60 * 60) as UTCTimestamp;
        break;
      case '6m':
        startTime = (endTime - 182 * 24 * 60 * 60) as UTCTimestamp;
        break;
      case '3m':
        startTime = (endTime - 91 * 24 * 60 * 60) as UTCTimestamp;
        break;
      case '1m':
        startTime = (endTime - 30 * 24 * 60 * 60) as UTCTimestamp;
        break;
      default:
        this.chart.timeScale().fitContent();
        return;
    }

    this.chart.timeScale().setVisibleRange({ from: startTime, to: endTime });
  }

  downloadCSV(): void {
    const url = `http://${environment.apiUrl}/download/${this.companySymbol}`;
    window.open(url, '_blank');
  }

  loadPredictionImages(): void {
    const baseUrl = 'http://${environment.apiUrl}/predictions';
    const symbol = this.companySymbol;
    const models = ['ANN', 'LSTM', 'RANDOMFOREST', 'SVR'];

    this.predictionImages = [];

    models.forEach(model => {
      const image: PredictionImage = {
        src: `${baseUrl}/${symbol}/${model}_prediction_plot.png`,
        title: '',
        description: 'Loading metrics...',
        rmse: 'Loading...',
        mae: 'Loading...',
        r2: 'Loading...'
      };

      switch (model) {
        case 'ANN':
          image.title = 'Artificial Neural Network Prediction';
          break;
        case 'LSTM':
          image.title = 'Long Short Term Memory Prediction';
          break;
        case 'RANDOMFOREST':
          image.title = 'Random Forest Prediction';
          break;
        case 'SVR':
          image.title = 'Support Vector Regression Prediction';
          break;
      }

      this.predictionImages.push(image);

      const metricsUrl = `${baseUrl}/${symbol}/${model}_metrics.txt`;

      this.http.get(metricsUrl, { responseType: 'text' }).subscribe({
        next: (metricsText) => {
          const index = this.predictionImages.findIndex(img => img.src.includes(`${model}_prediction_plot.png`));
          if (index !== -1) {
            const metrics = this.formatMetrics(metricsText);
            const averagePrice = this.getAveragePrice();

            const rmseNum = parseFloat(metrics.rmse);
            const maeNum = parseFloat(metrics.mae);

            const rmseLabel = isNaN(rmseNum) ? 'Unknown' : this.interpretError(rmseNum, averagePrice);
            const maeLabel = isNaN(maeNum) ? 'Unknown' : this.interpretError(maeNum, averagePrice);

            this.rmseLabel = rmseLabel;
            this.maeLabel = maeLabel;

            this.predictionImages[index].rmse = metrics.rmse;
            this.predictionImages[index].mae =metrics.mae;
            this.predictionImages[index].r2 = metrics.r2;

            if (this.selectedImage?.src === this.predictionImages[index].src) {
              this.selectedImage.rmse = metrics.rmse;
              this.selectedImage.mae = metrics.mae;
              this.selectedImage.r2 = metrics.r2;
            }
          }
        },
        error: () => {
          const index = this.predictionImages.findIndex(img => img.src.includes(`${model}_prediction_plot.png`));
          if (index !== -1) {
            this.predictionImages[index].rmse = 'N/A';
            this.predictionImages[index].mae = 'N/A';
            this.predictionImages[index].r2 = 'N/A';
          }
        }
      });
    });

    // Set first image selected by default
    this.selectedImage = this.predictionImages[0];
  }

  get filteredPredictionImages(): PredictionImage[] {
    return this.predictionImages.filter(
      (img) => img.src !== this.selectedImage?.src
    );
  }

  swapImage(image: PredictionImage): void {
    if (this.selectedImage && image.src !== this.selectedImage.src) {
      this.selectedImage = image;
    }
  }

  formatMetrics(text: string): { rmse: string; mae: string; r2: string } {
    // Match all numbers (with optional leading minus sign and decimals) in order of appearance
    const numbers = text.match(/-?\d+(\.\d+)?/g);

    return {
      rmse: numbers && numbers[0] ? numbers[0] : 'N/A',
      mae: numbers && numbers[1] ? numbers[1] : 'N/A',
      r2: numbers && numbers[2] ? numbers[2] : 'N/A',
    };
  }
  getAveragePrice(): number {
    if (!this.stockData || this.stockData.length === 0) return 0;

    const sum = this.stockData.reduce((acc, curr) => acc + curr.close, 0);
    return sum / this.stockData.length;
  }

  interpretError(error: number, averagePrice: number): string {
    if (!averagePrice || averagePrice <= 0 || isNaN(averagePrice)) {
      return 'Unknown'; // Can't calculate ratio with invalid averagePrice
    }

    const ratio = error / averagePrice;

    if (ratio < 0.05) return 'Excellent';
    if (ratio < 0.1) return 'Good';
    if (ratio < 0.2) return 'Fair';
    return 'Poor';
  }
}
