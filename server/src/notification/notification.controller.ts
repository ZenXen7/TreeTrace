// import {
//   Controller,
//   Get,
//   Post,
//   Param,
//   Body,
//   UseGuards,
//   Request,
//   HttpStatus,
//   HttpException,
//   Query,
// } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
// import { NotificationService } from './notification.service';
// import { SurnameSimilarityService } from './surname-similarity.service';

// @Controller('notifications')
// @UseGuards(JwtAuthGuard)
// export class NotificationController {
//   constructor(
//     private readonly notificationService: NotificationService,
//     private readonly surnameSimilarityService: SurnameSimilarityService,
//   ) {}

//   @Get()
//   async findAll(
//     @Request() req,
//     @Query('limit') limit?: number,
//     @Query('skip') skip?: number,
//     @Query('unreadOnly') unreadOnly?: boolean,
//   ) {
//     try {
//       const userId = req.user.id;
//       const notifications = await this.notificationService.findAllForUser(
//         userId,
//         {
//           limit: limit ? parseInt(limit.toString()) : undefined,
//           skip: skip ? parseInt(skip.toString()) : undefined,
//           unreadOnly: unreadOnly === 'true',
//         },
//       );

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Notifications retrieved successfully',
//         data: notifications,
//       };
//     } catch (error) {
//       throw new HttpException(
//         error.message || 'Error retrieving notifications',
//         error.status || HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }

//   @Get('unread-count')
//   async getUnreadCount(@Request() req) {
//     try {
//       const userId = req.user.id;
//       const count = await this.notificationService.getUnreadCount(userId);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Unread notification count retrieved successfully',
//         data: { count },
//       };
//     } catch (error) {
//       throw new HttpException(
//         error.message || 'Error retrieving unread notification count',
//         error.status || HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }

//   @Post(':id/mark-as-read')
//   async markAsRead(@Param('id') id: string) {
//     try {
//       const notification = await this.notificationService.markAsRead(id);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Notification marked as read successfully',
//         data: notification,
//       };
//     } catch (error) {
//       throw new HttpException(
//         error.message || 'Error marking notification as read',
//         error.status || HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }

//   @Post('mark-all-as-read')
//   async markAllAsRead(@Request() req) {
//     try {
//       const userId = req.user.id;
//       const result = await this.notificationService.markAllAsRead(userId);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'All notifications marked as read successfully',
//         data: result,
//       };
//     } catch (error) {
//       throw new HttpException(
//         error.message || 'Error marking all notifications as read',
//         error.status || HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }

//   @Post('analyze-family-tree')
//   async analyzeFamilyTree(@Request() req) {
//     try {
//       const userId = req.user.id;
//       await this.surnameSimilarityService.analyzeFamilyTreeForSimilarSurnames(userId);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Family tree analyzed for similar surnames successfully',
//       };
//     } catch (error) {
//       throw new HttpException(
//         error.message || 'Error analyzing family tree for similar surnames',
//         error.status || HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }
// }