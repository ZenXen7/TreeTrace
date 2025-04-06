import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Person extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  birthDate?: Date;

  @Prop()
  deathDate?: Date;

  @Prop({ enum: ['male', 'female', 'other'] })
  gender?: string;

  // Reference to parents
  @Prop({ type: [Types.ObjectId], ref: 'Person', default: [] })
  parents: Types.ObjectId[];

  // Reference to children
  @Prop({ type: [Types.ObjectId], ref: 'Person', default: [] })
  children: Types.ObjectId[];

  // Reference to spouses
  @Prop({ type: [Types.ObjectId], ref: 'Person', default: [] })
  spouses: Types.ObjectId[];
}

export const PersonSchema = SchemaFactory.createForClass(Person);
