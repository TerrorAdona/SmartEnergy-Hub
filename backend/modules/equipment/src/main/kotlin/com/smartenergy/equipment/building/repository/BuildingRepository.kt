package com.smartenergy.equipment.building.repository

import com.smartenergy.equipment.building.model.Building
import org.springframework.data.mongodb.repository.MongoRepository

interface BuildingRepository : MongoRepository<Building, String>