# firmware/core-mcu/CMakeLists.txt
# ---------------------------------------------------------------------------
# Builds the production ChronoCase firmware for either reference target.
# Select the target at configure time, e.g.:
#
#   cmake -B build -DCV_TARGET=STM32H7
#   cmake -B build -DCV_TARGET=NRF5340
#
# This file defines the portable sources shared by both targets (drivers/,
# tinyml/, src/). Each target additionally needs its vendor SDK/HAL
# (STM32CubeH7 or the nRF Connect SDK) and TensorFlow Lite Micro pulled in
# as a separate dependency — not vendored in this repository.
# ---------------------------------------------------------------------------
cmake_minimum_required(VERSION 3.20)
project(chronocase_firmware C CXX ASM)

set(CV_TARGET "STM32H7" CACHE STRING "Target MCU: STM32H7 or NRF5340")

if (CV_TARGET STREQUAL "STM32H7")
    add_compile_definitions(TARGET_STM32H7)
elseif (CV_TARGET STREQUAL "NRF5340")
    add_compile_definitions(TARGET_NRF5340)
else()
    message(FATAL_ERROR "CV_TARGET must be STM32H7 or NRF5340, got: ${CV_TARGET}")
endif()

set(CV_SOURCES
    src/main.c
    src/state_machine.c
    src/flash_ringbuffer.c
    src/telemetry.c
    src/lab_profile.c
    drivers/bme688_driver.c
    drivers/as7341_driver.c
    drivers/lsm6dsox_driver.c
    drivers/max31865_rtd.c
    drivers/tec_driver.c
    drivers/stiffness_actuator_driver.c
    tinyml/pqi_inference.c
)

add_library(chronocase_core ${CV_SOURCES})
target_include_directories(chronocase_core PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/drivers
    ${CMAKE_CURRENT_SOURCE_DIR}/tinyml
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# TODO: link against the vendor HAL/SDK and TFLite Micro static library,
# e.g.:
#   target_link_libraries(chronocase_core PUBLIC stm32h7_hal tflite_micro)
# and add the corresponding vendor toolchain file via
#   -DCMAKE_TOOLCHAIN_FILE=<path/to/arm-none-eabi.cmake>