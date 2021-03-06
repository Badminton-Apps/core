import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import * as moment from 'moment-timezone';
import { DataPoint, logarithmic } from 'regression';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnInit {
  @Input()
  rankingPlaces: {
    level: number;
    rankingDate: Date;
    points: number;
    pointsDowngrade: number;
    updatePossible: boolean;
  }[];

  @Input()
  maxLevels: number;

  @Input()
  probablyInacurate: moment.Moment = moment('2018-07-31T22:00:00.000Z');

  seriesData = [];
  seriesDataInacc = [];
  axisData = [];
  firstDay: Date;
  lastDay: Date;

  interval() {
    return false;
  }

  ngOnInit() {
    this.rankingPlaces = this.rankingPlaces.sort(
      (a, b) =>
        new Date(b.rankingDate).getTime() - new Date(a.rankingDate).getTime()
    );
    this.calcaulteforecast();
    this.createSeries();

    // Get the years for start / end to space them in year basis
    const lastDay = moment(this.rankingPlaces[0].rankingDate)
      .startOf('year')
      .add(1, 'year');
    const firstDay = moment(
      this.rankingPlaces[this.rankingPlaces.length - 1].rankingDate
    ).startOf('year');
    this.firstDay = firstDay.toDate();
    this.lastDay = lastDay.toDate();
  }

  createSeries() {
    this.rankingPlaces.filter(places => places.updatePossible).forEach((x) => {
      const rankingDate = moment(x.rankingDate).tz('Europe/Brussels');

      if (rankingDate.isBefore(this.probablyInacurate)) {
        this.seriesDataInacc.push({
          name: {
            top: `Level ${x.level} on ${rankingDate.format('DD-MM-Y')}`,
            bottom: `With ${x.points} upgrade, ${x.pointsDowngrade} downgrade points`,
          },
          subName: `With ${x.points} upgrade, ${x.pointsDowngrade} downgrade points`,
          value: [rankingDate.toDate(), x.level],
        });
      } else {
        this.seriesData.push({
          name: {
            top: `Level ${x.level} on ${rankingDate.format('DD-MM-Y')}`,
            bottom: `With ${x.points} upgrade, ${x.pointsDowngrade} downgrade points`,
          },
          value: [rankingDate.toDate(), x.level],
        });
      }
    });

    // adding the last value from series data to inacc to complete the line
    // the last value because that's how the sorting was configured
    this.seriesDataInacc.unshift(this.seriesData[this.seriesData.length - 1]);
  }

  calcaulteforecast() {
    var values = this.rankingPlaces.map((item, i) => [i, item.level]) as DataPoint[];
    // console.log('from', values);
    var result = logarithmic(values);
    // console.log('to', result);
  }
}
