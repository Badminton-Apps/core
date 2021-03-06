import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Club, Team, Player, PlayerService, Location } from 'app/_shared';
import { debounceTime, pairwise, skip, startWith } from 'rxjs/operators';
import { merge } from 'rxjs';

@Component({
  selector: 'app-team-fields',
  templateUrl: './team-fields.component.html',
  styleUrls: ['./team-fields.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamFieldsComponent implements OnInit {
  @Output() onTeamUpdated = new EventEmitter<Partial<Team>>();
  @Output() onCaptainUpdated = new EventEmitter<Partial<Player>>();
  @Output() onLocationAdded = new EventEmitter<Partial<Location>>();
  @Output() onLocationRemoved = new EventEmitter<Partial<Location>>();

  @Input()
  team: Team = {} as Team;

  @Input()
  club: Club;

  @Input()
  allowEditType: boolean;
  @Input()
  allowEditNumber: boolean;

  @Input()
  form: FormGroup;

  teamForm: FormGroup;

  captainForm: FormGroup;

  locationControl: FormControl;
  teamNumbers: number[];

  ngOnInit() {
    this.allowEditType = this.allowEditType ?? true;
    this.allowEditNumber = this.allowEditNumber ?? true;

    const numberControl = new FormControl(this.team.teamNumber, Validators.required);
    const typeControl = new FormControl(this.team.type, Validators.required);
    const preferredTimeControl = new FormControl(this.team.preferredTime);
    const preferredDayControl = new FormControl(this.team.preferredDay);

    const captainIdControl = new FormControl(this.team.captain?.id);
    const phoneControl = new FormControl(this.team.captain?.phone);
    const emailControl = new FormControl(this.team.captain?.email);

    this.locationControl = new FormControl(this.team.locations?.map((r) => r.id) ?? [], Validators.required);


    this.teamForm = new FormGroup({
      teamNumber: numberControl,
      type: typeControl,
      preferredTime: preferredTimeControl,
      preferredDay: preferredDayControl,
      captainId: captainIdControl,
    });

    if (this.allowEditNumber) {
      numberControl.enable();
    } else {
      numberControl.disable();
    }
    if (this.allowEditType) {
      typeControl.enable();
    } else {
      typeControl.disable();
    }

    this.captainForm = new FormGroup({
      id: new FormControl(this.team.captain?.id),
      phone: phoneControl,
      email: emailControl,
    });

    this.form.addControl('team', this.teamForm);
    this.form.addControl('captain', this.captainForm);


    if (this.team.id) {
      this.calcTeamsOfType(this.team.type);
    }

    typeControl.valueChanges.subscribe((type) => {
      this.calcTeamsOfType(type);
    });

    this.captainForm.valueChanges.pipe(debounceTime(600)).subscribe(async (e) => {
      if (this.captainForm.valid) {
        if (this.captainForm.dirty) {
          this.onCaptainUpdated.next(this.captainForm.value);
        }

        if (this.teamForm.value.captainId != this.captainForm.value.id) {
          this.teamForm.patchValue({
            captainId: this.captainForm.value.id,
          });
        }
      }
    });

    this.locationControl.valueChanges
      .pipe(debounceTime(600), startWith(this.team.locations?.map((r) => r.id) ?? []), pairwise())
      .subscribe(async ([prev, next]) => {
        let removed = prev.filter((item) => next.indexOf(item) < 0);
        let added = next.filter((item) => prev.indexOf(item) < 0);

        for (const add of added) {
          this.onLocationAdded.next(add);
        }
        for (const remove of removed) {
          this.onLocationRemoved.next(remove);
        }
      });

    this.teamForm.valueChanges.pipe(debounceTime(600)).subscribe(async (e) => {
      if (this.team?.id != null) {
        this.onTeamUpdated.next({
          id: this.team?.id,
          type: e?.type,
          teamNumber: e?.teamNumber,
          abbreviation: e?.abbreviation,
          preferredTime: e?.preferredTime,
          preferredDay: e?.preferredDay,
          captainId: e?.captainId,
        });
      }
    });
  }

  private calcTeamsOfType(type) {
    let teamsOfType = this.club.teams.filter((r) => r.type == type).length;
    if (this.team.id == null) {
      teamsOfType++;
      this.teamForm.patchValue({ teamNumber: teamsOfType });
    }
    this.teamNumbers = [...Array(teamsOfType).keys()].map((a) => a + 1);
  }

  async selectedCaptain(player: Player) {
    this.captainForm.patchValue({
      phone: player.phone,
      email: player.email,
      id: player.id,
    });
  }
}
