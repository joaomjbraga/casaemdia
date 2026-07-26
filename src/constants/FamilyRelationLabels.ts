export type FamilyRelation =
  | 'father'
  | 'mother'
  | 'son'
  | 'daughter'
  | 'brother'
  | 'sister'
  | 'husband'
  | 'wife'
  | 'grandfather'
  | 'grandmother'
  | 'grandson'
  | 'granddaughter'
  | 'uncle'
  | 'aunt'
  | 'cousin'
  | 'nephew'
  | 'niece'
  | 'stepfather'
  | 'stepmother'
  | 'stepson'
  | 'stepdaughter'
  | 'son_in_law'
  | 'daughter_in_law'
  | 'father_in_law'
  | 'mother_in_law'
  | 'brother_in_law'
  | 'sister_in_law'
  | 'great_grandfather'
  | 'great_grandmother'
  | 'great_grandson'
  | 'great_granddaughter'
  | 'boyfriend'
  | 'girlfriend'
  | 'fiance'
  | 'fiancee'
  | 'partner'
  | 'friend'
  | 'roommate'
  | 'resident'
  | 'responsible'
  | 'guest'
  | 'other';

export const FamilyRelationLabels: Record<FamilyRelation, string> = {
  father: 'Pai',
  mother: 'Mãe',
  son: 'Filho',
  daughter: 'Filha',
  brother: 'Irmão',
  sister: 'Irmã',
  husband: 'Marido',
  wife: 'Esposa',
  grandfather: 'Avô',
  grandmother: 'Avó',
  grandson: 'Neto',
  granddaughter: 'Neta',
  uncle: 'Tio',
  aunt: 'Tia',
  cousin: 'Primo',
  nephew: 'Sobrinho',
  niece: 'Sobrinha',
  stepfather: 'Padrasto',
  stepmother: 'Madrasta',
  stepson: 'Enteado',
  stepdaughter: 'Enteada',
  son_in_law: 'Genro',
  daughter_in_law: 'Nora',
  father_in_law: 'Sogro',
  mother_in_law: 'Sogra',
  brother_in_law: 'Cunhado',
  sister_in_law: 'Cunhada',
  great_grandfather: 'Bisavô',
  great_grandmother: 'Bisavó',
  great_grandson: 'Bisneto',
  great_granddaughter: 'Bisneta',
  boyfriend: 'Namorado',
  girlfriend: 'Namorada',
  fiance: 'Noivo',
  fiancee: 'Noiva',
  partner: 'Companheiro(a)',
  friend: 'Amigo(a)',
  roommate: 'Colega de casa',
  resident: 'Morador',
  responsible: 'Responsável',
  guest: 'Convidado(a)',
  other: 'Outro',
};

export const FamilyRelationGroups = [
  {
    label: 'Família',
    relations: [
      'father',
      'mother',
      'son',
      'daughter',
      'brother',
      'sister',
      'husband',
      'wife',
      'grandfather',
      'grandmother',
      'grandson',
      'granddaughter',
      'uncle',
      'aunt',
      'cousin',
      'nephew',
      'niece',
      'stepfather',
      'stepmother',
      'stepson',
      'stepdaughter',
      'son_in_law',
      'daughter_in_law',
      'father_in_law',
      'mother_in_law',
      'brother_in_law',
      'sister_in_law',
      'great_grandfather',
      'great_grandmother',
      'great_grandson',
      'great_granddaughter',
    ] as FamilyRelation[],
  },
  {
    label: 'Relacionamento',
    relations: [
      'boyfriend',
      'girlfriend',
      'fiance',
      'fiancee',
      'partner',
    ] as FamilyRelation[],
  },
  {
    label: 'Convivência',
    relations: [
      'friend',
      'roommate',
      'resident',
    ] as FamilyRelation[],
  },
  {
    label: 'Outros',
    relations: [
      'responsible',
      'guest',
      'other',
    ] as FamilyRelation[],
  },
];
