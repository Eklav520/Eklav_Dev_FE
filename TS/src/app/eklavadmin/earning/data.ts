import { ApexOptions } from 'apexcharts'

const root = document.documentElement

const style = getComputedStyle(root)

export const monthEarning: ApexOptions = {
  series: [
    {
      name: 'Payout',
      data: [500, 700, 900, 1500, 1800, 1000, 0, 2000, 3200, 3000, 4800, 4000],
    },
  ],
  chart: {
    height: 300,
    type: 'area',
    sparkline: {
      enabled: !0,
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: 'smooth',
  },
  colors: [style.getPropertyValue('--bs-primary')],
  xaxis: {
    type: 'category',
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct ', 'Nov', 'Dec'],
  },
  grid: {},
  tooltip: {
    y: {
      title: {
        formatter: function () {
          return '' + '$'
        },
      },
    },
    marker: {
      show: !1,
    },
  },
}

export const topEarning: ApexOptions = {
  series: [50, 20, 20, 10, 10],
  labels: ['Course-1', 'Course-2', 'Course-3', 'Course-4', 'Course-5'],
  chart: {
    height: 300,
    width: 300,
    offsetX: 50,
    type: 'donut',
    sparkline: {
      enabled: !0,
    },
  },
  colors: [
    style.getPropertyValue('--bs-success'),
    style.getPropertyValue('--bs-warning'),
    style.getPropertyValue('--bs-danger'),
    style.getPropertyValue('--bs-primary'),
    style.getPropertyValue('--bs-secondary'),
  ],
  tooltip: {
    theme: 'dark',
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 200,
          height: 200,
        },
        legend: {
          position: 'bottom',
        },
      },
    },
  ],
}
