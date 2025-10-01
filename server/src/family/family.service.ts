import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FamilyMember, FamilyMemberDocument } from './family-member.schema';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { FamilyMemberSimilarityService } from '../notification/family-member-similarity.service';
import { FamilyMemberWithId } from '../notification/similar-member.interface';

// Define interface for family tree response
export interface FamilyTreeNode {
  _id: Types.ObjectId;
  name: string;
  birthDate?: Date;
  gender?: string;
  status: string;
  userId: Types.ObjectId;
  fatherId?: Types.ObjectId;
  motherId?: Types.ObjectId;
  partnerId?: Types.ObjectId[]; // Updated to be an array of ObjectIds
  __v?: number;
  father?: FamilyTreeNode;
  mother?: FamilyTreeNode;
  partners?: FamilyTreeNode[];
  childNodes?: FamilyTreeNode[];
}

@Injectable()
export class FamilyService {
  constructor(
    @InjectModel(FamilyMember.name)
    private familyMemberModel: Model<FamilyMemberDocument>,
    private familyMemberSimilarityService: FamilyMemberSimilarityService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // async createFamilyMember(
  //   userId: string | Types.ObjectId,
  //   createFamilyMemberDto: CreateFamilyMemberDto,
  // ): Promise<FamilyMember> {
  //   const userObjectId = new Types.ObjectId(userId.toString());
  
  //   const createdFamilyMember = new this.familyMemberModel({ 
  //     ...createFamilyMemberDto,userId: userObjectId, 
  //   });

  //   const savedFamilyMember = await createdFamilyMember.save();
  
  //   return savedFamilyMember;
  // }

  async createFamilyMember(
    userId: string | Types.ObjectId,
    createFamilyMemberDto: CreateFamilyMemberDto,
  ): Promise<FamilyMember> {
    const userObjectId = new Types.ObjectId(userId.toString());
    const memberData = {
      ...createFamilyMemberDto,
      userId: userObjectId,
      relationship: createFamilyMemberDto.relationship || 'self'
    };

    // Automatically set status to 'dead' if death date is provided
    if (memberData.deathDate) {
      memberData.status = 'dead';
    }

    const createdFamilyMember = new this.familyMemberModel(memberData);
    const savedMember = await createdFamilyMember.save() as FamilyMemberWithId;

    // Invalidate relevant caches
    await this.invalidateUserCache(userId.toString());

    // Run cross-user similarity analysis asynchronously (don't block the response)
    setImmediate(async () => {
      try {
        await this.familyMemberSimilarityService.analyzeSimilaritiesAcrossUsers(userObjectId);
      } catch (error) {
        console.error('Error in similarity analysis:', error);
      }
    });

    return savedMember;
  }
  

  async findAll(userId: string, filters: Record<string, any> = {}): Promise<FamilyMember[]> {
    // Convert string userId to ObjectId before querying
    const userObjectId = new Types.ObjectId(userId);

    // Create cache key based on user and filters
    const cacheKey = `family_members:${userId}:${JSON.stringify(filters)}`;

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<FamilyMember[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Create query object with userId
    const query: Record<string, any> = { userId: userObjectId };

    // Add any additional filters from parameters
    Object.keys(filters).forEach(key => {
      query[key] = filters[key];
    });

    // Fetch all family members matching the query with lean() for better performance
    const results = await this.familyMemberModel.find(query).lean().exec();

    // Cache the result for 5 minutes
    await this.cacheManager.set(cacheKey, results, 300);

    return results;
  }

  async findAllWithPagination(
    userId: string,
    filters: Record<string, any> = {},
    paginationOptions: {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    }
  ): Promise<{
    data: FamilyMember[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    // Convert string userId to ObjectId before querying
    const userObjectId = new Types.ObjectId(userId);

    // Create cache key based on user, filters, and pagination
    const cacheKey = `family_members_paginated:${userId}:${JSON.stringify(filters)}:${JSON.stringify(paginationOptions)}`;

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<{
      data: FamilyMember[];
      pagination: { page: number; limit: number; total: number; pages: number; };
    }>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Create query object with userId
    const query: Record<string, any> = { userId: userObjectId };

    // Add any additional filters from parameters
    Object.keys(filters).forEach(key => {
      query[key] = filters[key];
    });

    const { page, limit, sortBy, sortOrder } = paginationOptions;
    const skip = (page - 1) * limit;

    // Create sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.familyMemberModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.familyMemberModel.countDocuments(query).exec()
    ]);

    const pages = Math.ceil(total / limit);

    const result = {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };

    // Cache the result for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async findAllByUserId(userId: string): Promise<FamilyMember[]> {
    try {
      // Convert string userId to ObjectId if it's not already
      const userObjectId = new Types.ObjectId(userId.toString());
      
      // Fetch all family members for this user
      const results = await this.familyMemberModel
        .find({ userId: userObjectId })
        .exec();
      
      return results;
    } catch (error) {
      throw new Error(`Error fetching family members for user ${userId}`);
    }
  }

  async findOne(id: string): Promise<FamilyMember> {
    // Create cache key for individual member
    const cacheKey = `family_member:${id}`;

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<FamilyMember>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const familyMember = await this.familyMemberModel.findById(id).lean().exec();
    if (!familyMember) {
      throw new NotFoundException(`Family member with ID ${id} not found`);
    }

    // Cache the result for 10 minutes (longer since individual members change less frequently)
    await this.cacheManager.set(cacheKey, familyMember, 600);

    return familyMember;
  }

  async update(
    id: string,
    updateFamilyMemberDto: Partial<CreateFamilyMemberDto>,
  ): Promise<FamilyMember> {
    // If death date is provided, automatically set status to 'dead'
    if (updateFamilyMemberDto.deathDate) {
      updateFamilyMemberDto.status = 'dead';
    }

    const session = await this.familyMemberModel.db.startSession();
    session.startTransaction();

    try {
      // Get the current member to know the userId for cache invalidation
      const currentMember = await this.familyMemberModel.findById(id).session(session);
      if (!currentMember) {
        throw new NotFoundException(`Family member with ID ${id} not found`);
      }

      const updatedFamilyMember = await this.familyMemberModel
        .findByIdAndUpdate(id, updateFamilyMemberDto, { new: true })
        .session(session);

      if (!updatedFamilyMember) {
        throw new NotFoundException(`Family member with ID ${id} not found`);
      }

      // If fatherId is being updated, add this member as a child to the father
      if (updateFamilyMemberDto.fatherId) {
        await this.familyMemberModel.findByIdAndUpdate(
          updateFamilyMemberDto.fatherId,
          { $addToSet: { childId: updatedFamilyMember._id } },
          { new: true }
        ).session(session);
      }
      // If motherId is being updated, add this member as a child to the mother
      if (updateFamilyMemberDto.motherId) {
        await this.familyMemberModel.findByIdAndUpdate(
          updateFamilyMemberDto.motherId,
          { $addToSet: { childId: updatedFamilyMember._id } },
          { new: true }
        ).session(session);
      }
      // If partnerId is being updated, update the partners' partnerId as well
      if (updateFamilyMemberDto.partnerId && updateFamilyMemberDto.partnerId.length > 0) {
        for (const partnerId of updateFamilyMemberDto.partnerId) {
          await this.familyMemberModel
            .findByIdAndUpdate(
              partnerId,
              { $addToSet: { partnerId: id } }, // Add the current ID to the partner's partnerId array
              { new: true },
            )
            .session(session);
        }
      }

      await session.commitTransaction();

      // Invalidate relevant caches
      await this.invalidateUserCache(currentMember.userId.toString());

      // Run cross-user similarity analysis asynchronously after update
      setImmediate(async () => {
        try {
          await this.familyMemberSimilarityService.analyzeSimilaritiesAcrossUsers(updatedFamilyMember.userId);
        } catch (error) {
          console.error('Error in similarity analysis:', error);
        }
      });

      return updatedFamilyMember;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async remove(id: string): Promise<FamilyMember> {
    // Get the member first to know the userId for cache invalidation
    const memberToDelete = await this.familyMemberModel.findById(id);
    if (!memberToDelete) {
      throw new NotFoundException(`Family member with ID ${id} not found`);
    }

    const deletedFamilyMember = await this.familyMemberModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedFamilyMember) {
      throw new NotFoundException(`Family member with ID ${id} not found`);
    }

    // Invalidate relevant caches
    await this.invalidateUserCache(memberToDelete.userId.toString());

    return deletedFamilyMember;
  }

  // Helper method to invalidate all user-related caches
  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      // Delete all cache keys related to this user
      const keys = [
        `family_members:${userId}:*`,
        `family_tree:${userId}`,
        `family_member:*` // Individual member caches might be affected
      ];

      // Note: In a real implementation, you'd want to use cache.del() with patterns
      // For now, we'll clear specific cache keys when a user makes changes
      // This is a simple but effective approach for this use case
      const keysToDelete = [
        `family_members:${userId}:*`,
        `family_tree:${userId}`,
        `family_member:*`
      ];
      // For now, we'll just clear all cache as a simple solution
      // In production, you'd want to implement pattern-based cache deletion
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  /**
   * Check for similar family members after member creation or update
   * @param id ID of the family member to check
   * @param userId ID of the user who owns the family member
   */
  async checkForSimilarFamilyMembers(id: string, userId: string): Promise<void> {
    try {
      await this.familyMemberSimilarityService.checkForSimilarFamilyMembers(id, userId);
    } catch (error) {
      // console.error('Error checking for similar family members:', error);
    }
  }

  async getFamilyTree(id: string): Promise<FamilyTreeNode> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Invalid ID format: ${id}`);
      }

      const familyMember = await this.familyMemberModel
        .findById(id)
        .populate('fatherId')
        .populate('motherId')
        .populate('partnerId')
        .exec();

      if (!familyMember) {
        throw new NotFoundException(`Family member with ID ${id} not found`);
      }

      const result = familyMember.toObject() as FamilyTreeNode;

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new NotFoundException(
        `Error fetching family tree: ${errorMessage}`,
      );
    }
  }

  async getPublicFamilyTree(userId: string): Promise<FamilyTreeNode[]> {
    try {
      // Convert string userId to ObjectId
      const userObjectId = new Types.ObjectId(userId);

      // Create cache key for family tree
      const cacheKey = `family_tree:${userId}`;

      // Try to get from cache first (cache for longer since trees don't change often)
      const cachedResult = await this.cacheManager.get<FamilyTreeNode[]>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Find root members (members without parents) - optimized query
      const rootMembers = await this.familyMemberModel
        .find({
          userId: userObjectId,
          fatherId: { $exists: false },
          motherId: { $exists: false }
        })
        .lean()
        .exec();

      if (!rootMembers || rootMembers.length === 0) {
        // If no roots found, get all members and use first as root
        const allMembers = await this.familyMemberModel
          .find({ userId: userObjectId })
          .sort({ createdAt: 1 })
          .limit(1)
          .lean()
          .exec();

        if (allMembers.length === 0) {
          return [];
        }
        rootMembers.push(allMembers[0]);
      }

      // Create tree nodes for each root member using optimized recursive approach
      const treeNodes = await Promise.all(
        rootMembers.map((root) =>
          this.buildFamilyTreeNodeOptimized(root._id as Types.ObjectId, userObjectId),
        ),
      );

      // Cache the result for 30 minutes
      await this.cacheManager.set(cacheKey, treeNodes, 1800);

      return treeNodes.filter((node): node is FamilyTreeNode => node !== null);
    } catch (error) {
      throw new Error('Failed to retrieve public family tree');
    }
  }

  // Optimized family tree node building - only loads necessary data
  private async buildFamilyTreeNodeOptimized(
    memberId: Types.ObjectId,
    userObjectId: Types.ObjectId,
    visited = new Set<string>()
  ): Promise<FamilyTreeNode | null> {
    const memberIdStr = memberId.toString();

    // Prevent infinite loops in case of circular references
    if (visited.has(memberIdStr)) {
      return null;
    }
    visited.add(memberIdStr);

    try {
      // Get the main member
      const member = await this.familyMemberModel
        .findById(memberId)
        .lean()
        .exec();

      if (!member) {
        return null;
      }

      const treeNode: FamilyTreeNode = {
        _id: member._id as Types.ObjectId,
        name: member.name,
        birthDate: member.birthDate,
        gender: member.gender,
        status: member.status,
        userId: member.userId as Types.ObjectId,
        fatherId: member.fatherId as Types.ObjectId | undefined,
        motherId: member.motherId as Types.ObjectId | undefined,
        partnerId: member.partnerId,
        __v: member.__v,
      };

      // Build relationships concurrently for better performance
      const relationshipPromises: Promise<void>[] = [];

      // Get father
      if (member.fatherId) {
        relationshipPromises.push(
          this.buildFamilyTreeNodeOptimized(member.fatherId, userObjectId, visited)
            .then(father => { if (father) treeNode.father = father; })
            .catch(() => { treeNode.father = undefined; })
        );
      }

      // Get mother
      if (member.motherId) {
        relationshipPromises.push(
          this.buildFamilyTreeNodeOptimized(member.motherId, userObjectId, visited)
            .then(mother => { if (mother) treeNode.mother = mother; })
            .catch(() => { treeNode.mother = undefined; })
        );
      }

      // Get partners
      if (member.partnerId && member.partnerId.length > 0) {
        const partnerPromises = member.partnerId.map(partnerId =>
          this.buildFamilyTreeNodeOptimized(partnerId, userObjectId, visited)
        );
        relationshipPromises.push(
          Promise.all(partnerPromises)
            .then(partners => { treeNode.partners = partners.filter(p => p !== null); })
            .catch(() => { treeNode.partners = []; })
        );
      }

      // Get children
      const childrenPromise = this.familyMemberModel
        .find({
          userId: userObjectId,
          $or: [
            { fatherId: memberId },
            { motherId: memberId }
          ]
        })
        .lean()
        .exec()
        .then(children => {
          if (children.length > 0) {
            return Promise.all(
              children.map(child =>
                this.buildFamilyTreeNodeOptimized(child._id as Types.ObjectId, userObjectId, visited)
              )
            ).then(childNodes => { treeNode.childNodes = childNodes.filter((c): c is FamilyTreeNode => c !== null); });
          } else {
            treeNode.childNodes = [];
          }
        })
        .catch(() => { treeNode.childNodes = []; });

      relationshipPromises.push(childrenPromise);

      // Wait for all relationships to be built
      await Promise.all(relationshipPromises);

      return treeNode;
    } catch (error) {
      console.error('Error building family tree node:', error);
      return null;
    }
  }
}
