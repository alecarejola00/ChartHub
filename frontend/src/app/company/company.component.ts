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
  r2Label?: string;

  predictionImages: PredictionImage[] = [];
  selectedImage: PredictionImage | null = null;
  loadingChart: boolean = false;

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

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private http: HttpClient,
    private selectedCompanyService: SelectedCompanyService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const symbol = params.get('symbol');
      if (symbol) {
        this.companySymbol = symbol;
        this.loadCompanyData();
      }
    });

    this.selectedCompanyService.selectedSymbol$.subscribe((symbol) => {
      if (symbol && symbol !== this.companySymbol) {
        this.companySymbol = symbol;
        this.loadCompanyData();
      }
    });
  }

  ngAfterViewInit(): void {
    // Optional: Post-view initialization
    this.loadCompanyData();
  }

  loadCompanyData(): void {
    this.loadingChart = true;

    this.dataService.getCompanyBySymbol(this.companySymbol).subscribe((company) => {
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

        mapped.sort((a: { time: number; }, b: { time: number; }) => a.time - b.time);

        const uniqueData = [];
        let lastTime: number | null = null;
        for (const item of mapped) {
          if (item.time !== lastTime) {
            uniqueData.push(item);
            lastTime = item.time;
          }
        }

        this.stockData = uniqueData;

        setTimeout(() => {
          if (this.chartContainer) {
            this.initializeChart();
          }
          this.loadPredictionImages();
          this.loadingChart = false;
        }, 0);
      },
      (error) => {
        console.error('Error fetching stock data:', error);
        this.loadPredictionImages();
        this.loadingChart = false;
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

    const candlestickSeries = this.chart.addSeries(CandlestickSeries, {
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
      if (param && param.time && param.seriesData && param.seriesData.has(candlestickSeries)) {
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
    const url = `${environment.apiUrl}/download/${this.companySymbol}`;
    window.open(url, '_blank');
  }

  loadPredictionImages(): void {
    const baseUrl = `${environment.apiUrl}/predictions`;
    const symbol = this.companySymbol;
    const models = ['ANN', 'LSTM', 'RANDOMFOREST', 'SVR'];

    this.predictionImages = [];

    models.forEach((model, i) => {
      const image: PredictionImage = {
        src: `${baseUrl}/${symbol}/${model}_prediction_plot.png`,
        title: '',
        description: 'Loading metrics...',
        rmse: 'Loading...',
        mae: 'Loading...',
        r2: 'Loading...',
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
          const index = this.predictionImages.findIndex(img =>
            img.src.includes(`${model}_prediction_plot.png`)
          );

          if (index !== -1) {
            const metrics = this.formatMetrics(metricsText);
            const averagePrice = this.getAveragePrice();

            const rmseNum = parseFloat(metrics.rmse);
            const maeNum = parseFloat(metrics.mae);
            const r2Num = parseFloat(metrics.r2);

            const rmseLabel = isNaN(rmseNum)
              ? 'Unknown'
              : this.interpretError(rmseNum, averagePrice);
            const maeLabel = isNaN(maeNum)
              ? 'Unknown'
              : this.interpretError(maeNum, averagePrice);
            const r2Label = isNaN(r2Num)
              ? 'Unknown'
              : this.interpretR2(r2Num);

            this.predictionImages[index].rmse = metrics.rmse;
            this.predictionImages[index].mae = metrics.mae;
            this.predictionImages[index].r2 = metrics.r2;

            if (this.selectedImage?.src === this.predictionImages[index].src) {
              this.selectedImage.rmse = metrics.rmse;
              this.selectedImage.mae = metrics.mae;
              this.selectedImage.r2 = metrics.r2;
            }

            // Update summary only for selected image
            if (index === 0 && !this.selectedImage) {
              this.selectedImage = this.predictionImages[0];

              // Only update labels if metrics are successfully parsed
              if (!isNaN(rmseNum) && !isNaN(maeNum) && !isNaN(r2Num)) {
                this.rmseLabel = rmseLabel;
                this.maeLabel = maeLabel;
                this.r2Label = r2Label;
              }
            }
          }
        },
        error: () => {
          const index = this.predictionImages.findIndex(img =>
            img.src.includes(`${model}_prediction_plot.png`)
          );
          if (index !== -1) {
            this.predictionImages[index].rmse = 'N/A';
            this.predictionImages[index].mae = 'N/A';
            this.predictionImages[index].r2 = 'N/A';
          }
        },
      });
    });
  }

  get filteredPredictionImages(): PredictionImage[] {
    return this.predictionImages.filter(
      (img) => img.src !== this.selectedImage?.src
    );
  }

  swapImage(image: PredictionImage): void {
    if (this.selectedImage && image.src !== this.selectedImage.src) {
      this.selectedImage = image;

      const matchedImage = this.predictionImages.find(img => img.src === image.src);
      if (matchedImage) {
        this.selectedImage.rmse = matchedImage.rmse;
        this.selectedImage.mae = matchedImage.mae;
        this.selectedImage.r2 = matchedImage.r2;

        const rmseNum = parseFloat(matchedImage.rmse);
        const maeNum = parseFloat(matchedImage.mae);
        const r2Num = parseFloat(matchedImage.r2);
        const avg = this.getAveragePrice();

        this.rmseLabel = isNaN(rmseNum) ? 'Unknown' : this.interpretError(rmseNum, avg);
        this.maeLabel = isNaN(maeNum) ? 'Unknown' : this.interpretError(maeNum, avg);
        this.r2Label = isNaN(r2Num) ? 'Unknown' : this.interpretR2(r2Num);
      }
    }
  }

  formatMetrics(text: string): { rmse: string; mae: string; r2: string } {
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
      return 'Unknown';
    }

    const ratio = error / averagePrice;

    if (ratio < 0.05) return 'Excellent'; // Error less than 5% of avg price — very accurate
    if (ratio < 0.1) return 'Good';       // Less than 10% error — still good
    if (ratio < 0.2) return 'Fair';       // Up to 20% error — acceptable with caution
    return 'Poor';                        // More than 20% error — probably unreliable
  }

  interpretR2(r2: number): string {
    if (isNaN(r2)) return 'Unknown';

    if (r2 >= 0.9) return 'Excellent';  // Score >= 90%
    if (r2 >= 0.75) return 'Good';      // Score >= 75% < 90%
    if (r2 >= 0.5) return 'Fair';       // Score >= 50% < 75%
    return 'Poor';                      // Socre < 50%
  }
getRmseDetails(label: string): string {
  switch (label) {
    case 'Excellent':
      return 'The model predicts prices very accurately with minimal errors.';
    case 'Good':
      return 'The model predictions are generally accurate with some minor errors.';
    case 'Fair':
      return 'The model predictions have moderate errors; use with some caution.';
    case 'Poor':
      return 'The model predictions have large errors and may be unreliable.';
    default:
      return '';
  }
}

getR2Details(label: string): string {
  switch (label) {
    case 'Excellent':
      return 'The model explains most of the variability in the data.';
    case 'Good':
      return 'The model explains a good amount of the variability.';
    case 'Fair':
      return 'The model explains some of the variability but not very well.';
    case 'Poor':
      return 'The model explains little of the variability; predictions may be poor.';
    default:
      return '';
    }
  }
}