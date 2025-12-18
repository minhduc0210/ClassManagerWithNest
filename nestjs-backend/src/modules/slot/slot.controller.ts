import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { SlotService } from './slot.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import express from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
@Controller('slots')
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @Post(':classroomID')
  async create(
    @Param('classroomID') classroomID: string,
    @Body() createSlotDto: CreateSlotDto,
    @Res() res: express.Response,
  ) {
    const newSlot = await this.slotService.create(classroomID, createSlotDto);
    res.status(HttpStatus.CREATED).json({
      status: 201,
      message: 'Slot created successfully',
      slot: newSlot,
    });
  }

  @Get()
  findAll() {
    return this.slotService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.slotService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSlotDto: UpdateSlotDto,
    @Res() res: express.Response,
  ) {
    const updatedSlot = await this.slotService.update(id, updateSlotDto);
    res.status(HttpStatus.OK).json({
      status: 200,
      message: 'Slot updated successfully',
      slot: updatedSlot,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.slotService.remove(+id);
  }
}
