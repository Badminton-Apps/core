import { FormGroup } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Club, Location, Player, SystemService, Team, TeamService } from 'app/_shared';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';

import * as addTeamMutation from '../../../_shared/graphql/teams/mutations/addTeam.graphql';
import * as updateTeamMutation from '../../../_shared/graphql/teams/mutations/updateTeam.graphql';
import * as updatePlayerMutation from '../../../_shared/graphql/players/mutations/UpdatePlayerMutation.graphql';
import * as updateTeamLocation from './graphql/UpdateTeamLocation.graphql';
import * as teamQuery from '../../../_shared/graphql/teams/queries/GetTeamQuery.graphql';

@Component({
  templateUrl: './team-dialog.component.html',
  styleUrls: ['./team-dialog.component.scss'],
})
export class TeamDialogComponent implements OnInit {
  team$: Observable<Team>;
  alreadyUsed$: Observable<string[]>;

  update$ = new BehaviorSubject(0);

  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { team: Team; club: Club; allowEditType: boolean; allowEditNumber: boolean },
    private teamService: TeamService,
    private apollo: Apollo
  ) {}

  ngOnInit(): void {
    this.team$ = this.update$.pipe(
      startWith(0),
      switchMap(() => {
        if (this.data.team?.id) {
          return this.apollo
            .query<{ team: Team }>({
              query: teamQuery,
              variables: {
                id: this.data.team?.id,
              },
            })
            .pipe(map((x) => new Team(x.data.team)));
        } else {
          return of(null);
        }
      }),
      map((t) => t ?? new Team())
    );

    if (this.data.club) {
      this.alreadyUsed$ = this.team$.pipe(
        map(
          (team) =>
            this.data.club.teams
              .filter((t) => t.type == team?.type && t.id != team?.id && t.active)
              ?.map((t) => t.players.filter((p) => p.base).map((p) => p.id))
              ?.flat() ?? []
        ),
        startWith([])
      );
    }

    this.form = new FormGroup({});
  }

  async onPlayerAddedToTeam(player: Player, team: Team) {
    if (player) {
      await this.teamService.addPlayer(team, player).toPromise();

      this.update$.next(0);
    }
  }

  async onPlayerRemovedFromTeam(player: Player, team: Team) {
    if (player && team.id) {
      await this.teamService.removePlayer(team, player).toPromise();
      this.update$.next(0);
    }
  }

  async onPlayerUpdatedFromTeam(player: Player, team: Team) {
    if (player && team.id) {
      await this.teamService.updatePlayer(team, player).toPromise();
      this.update$.next(0);
    }
  }

  async teamAdded(team: Partial<Team>) {
    const newTeam = await this.apollo
      .mutate<{ addTeam: Team }>({
        mutation: addTeamMutation,
        variables: {
          team: { ...team },
          clubId: this.data.club.id,
        },
      })
      .pipe(map((x) => new Team(x.data.addTeam)))
      .toPromise();

    this.data.team = newTeam;
    this.update$.next(0);
  }

  async onTeamUpdated(team: Partial<Team>) {
    await this.apollo
      .mutate<{ updateTeam: Team }>({
        mutation: updateTeamMutation,
        variables: {
          team,
        },
      })
      .pipe(map((x) => new Team(x.data.updateTeam)))
      .toPromise();
    this.update$.next(0);
  }

  async onCaptainUpdated(player: Partial<Player>) {
    await this.apollo
      .mutate<{ updatePlayer: Player }>({
        mutation: updatePlayerMutation,
        variables: {
          player,
        },
      })
      .pipe(map((r) => new Player(r.data.updatePlayer)))
      .toPromise();
    this.update$.next(0);
  }

  async onLocationAdded(location: string, team: Team) {
    await this.apollo
      .mutate({
        mutation: updateTeamLocation,
        variables: {
          teamId: team.id,
          locationId: location,
          use: true,
        },
      })
      .toPromise();

    this.update$.next(0);
  }

  async onLocationRemoved(location: string, team: Team) {
    await this.apollo
      .mutate({
        mutation: updateTeamLocation,
        variables: {
          teamId: team.id,
          locationId: location,
          use: false,
        },
      })
      .toPromise();

    this.update$.next(0);
  }
}
