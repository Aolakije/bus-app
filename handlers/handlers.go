package handlers

import (
	"net/http"
	"strconv"

	"busapp/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetRoutesHandler - returns all routes with stops & schedules
func GetRoutesHandler(c *gin.Context, db *gorm.DB) {
	var routes []models.Route
	if err := db.Preload("Stops", func(db *gorm.DB) *gorm.DB {
		return db.Order("order_index asc")
	}).Preload("Schedules").Find(&routes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query routes"})
		return
	}
	c.JSON(http.StatusOK, routes)
}

// GetRouteByIDHandler - returns a single route
func GetRouteByIDHandler(c *gin.Context, db *gorm.DB) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var route models.Route
	if err := db.Preload("Stops", func(db *gorm.DB) *gorm.DB {
		return db.Order("order_index asc")
	}).Preload("Schedules").First(&route, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query route"})
		return
	}
	c.JSON(http.StatusOK, route)
}
