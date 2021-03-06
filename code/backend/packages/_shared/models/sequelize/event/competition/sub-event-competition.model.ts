import {
  BelongsToGetAssociationMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyAddAssociationsMixin,
  BelongsToManyCountAssociationsMixin,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyHasAssociationMixin,
  BelongsToManyHasAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  BelongsToSetAssociationMixin,
  BuildOptions,
  HasManyAddAssociationMixin,
  HasManyAddAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  HasManyHasAssociationsMixin,
  HasManyRemoveAssociationMixin,
  HasManyRemoveAssociationsMixin,
  HasManySetAssociationsMixin
} from 'sequelize';
import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  Unique
} from 'sequelize-typescript';
import { LevelType, SubEventType } from '../../../enums';
import { RankingSystemGroup } from '../../ranking';
import { TeamSubEventMembership } from '../../team-subEvent-membership.model';
import { Team } from '../../team.model';
import { DrawCompetition } from './draw-competition.model';
import { EventCompetition } from './event-competition.model';
import { GroupSubEventCompetition } from './group_subevent.model';

@Table({
  timestamps: true,
  schema: 'event'
})
export class SubEventCompetition extends Model {
  constructor(values?: Partial<SubEventCompetition>, options?: BuildOptions) {
    super(values, options);
  }

  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @PrimaryKey
  @Column
  id: string;

  @Unique('unique_constraint')
  @Column
  name: string;

  @Unique('unique_constraint')
  @Column(DataType.ENUM('M', 'F', 'MX', 'MINIBAD'))
  eventType: SubEventType;

  @Column
  level?: number;

  @Column
  maxLevel?: number;

  @Column
  minBaseIndex?: number;

  @Column
  maxBaseIndex?: number;

  @BelongsToMany(
    () => Team,
    () => TeamSubEventMembership,
  )
  teams: Team[];

  @BelongsToMany(
    () => RankingSystemGroup,
    () => GroupSubEventCompetition
  )
  groups: RankingSystemGroup[];

  @HasMany(() => DrawCompetition, {
    foreignKey: 'subeventId',
    onDelete: 'CASCADE'
  })
  draws: DrawCompetition[];

  @BelongsTo(() => EventCompetition, {
    foreignKey: 'eventId',
    onDelete: 'CASCADE'
  })
  event?: EventCompetition;

  @Unique('unique_constraint')
  @ForeignKey(() => EventCompetition)
  @Column
  eventId: string;

  // Belongs to many Group
  getGroups!: BelongsToManyGetAssociationsMixin<RankingSystemGroup>;
  setGroups!: BelongsToManySetAssociationsMixin<RankingSystemGroup, string>;
  addGroups!: BelongsToManyAddAssociationsMixin<RankingSystemGroup, string>;
  addGroup!: BelongsToManyAddAssociationMixin<RankingSystemGroup, string>;
  removeGroup!: BelongsToManyRemoveAssociationMixin<RankingSystemGroup, string>;
  removeGroups!: BelongsToManyRemoveAssociationsMixin<
    RankingSystemGroup,
    string
  >;
  hasGroup!: BelongsToManyHasAssociationMixin<RankingSystemGroup, string>;
  hasGroups!: BelongsToManyHasAssociationsMixin<RankingSystemGroup, string>;
  countGroup!: BelongsToManyCountAssociationsMixin;

  // Belongs to many Team
  getTeams!: BelongsToManyGetAssociationsMixin<Team>;
  setTeam!: BelongsToManySetAssociationsMixin<Team, string>;
  addTeams!: BelongsToManyAddAssociationsMixin<Team, string>;
  addTeam!: BelongsToManyAddAssociationMixin<Team, string>;
  removeTeam!: BelongsToManyRemoveAssociationMixin<Team, string>;
  removeTeams!: BelongsToManyRemoveAssociationsMixin<Team, string>;
  hasTeam!: BelongsToManyHasAssociationMixin<Team, string>;
  hasTeams!: BelongsToManyHasAssociationsMixin<Team, string>;
  countTeam!: BelongsToManyCountAssociationsMixin;

  // Has many draw
  getdraws!: HasManyGetAssociationsMixin<DrawCompetition>;
  setdraws!: HasManySetAssociationsMixin<DrawCompetition, string>;
  adddraws!: HasManyAddAssociationsMixin<DrawCompetition, string>;
  adddraw!: HasManyAddAssociationMixin<DrawCompetition, string>;
  removedraw!: HasManyRemoveAssociationMixin<DrawCompetition, string>;
  removedraws!: HasManyRemoveAssociationsMixin<DrawCompetition, string>;
  hasdraw!: HasManyHasAssociationMixin<DrawCompetition, string>;
  hasdraws!: HasManyHasAssociationsMixin<DrawCompetition, string>;
  countdraws!: HasManyCountAssociationsMixin;

  // Belongs to Event
  getEvent!: BelongsToGetAssociationMixin<EventCompetition>;
  setEvent!: BelongsToSetAssociationMixin<EventCompetition, string>;
}
